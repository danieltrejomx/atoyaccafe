import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { CrearPedidoInput } from '../schemas';
import type { Canal, Estado, Pedido, PagoMetodo } from '../types';
import { getDb, schema, type Db, type Tx } from './db';
import { ErrorNegocio } from './http';
import { moverStock, obtenerInsumo } from './insumos';
import { emitir } from './sse';
import { fechaNegocio, siguienteTurno } from './turnos';

const { pedidos, pedidoItems, productos, opciones, recetas, movimientosInsumo } = schema;

function armar(conn: Db | Tx, filas: (typeof pedidos.$inferSelect)[]): Pedido[] {
	if (!filas.length) return [];
	const items = conn
		.select()
		.from(pedidoItems)
		.where(
			inArray(
				pedidoItems.pedidoId,
				filas.map((f) => f.id)
			)
		)
		.all();
	return filas.map((p) => ({
		...p,
		items: items
			.filter((i) => i.pedidoId === p.id)
			.map(({ pedidoId: _, ...i }) => i)
	}));
}

export function obtenerPedido(id: number, conn: Db | Tx = getDb()): Pedido | undefined {
	return armar(conn, conn.select().from(pedidos).where(eq(pedidos.id, id)).all())[0];
}

/** Pedidos del día del negocio (los más nuevos primero), filtrables. */
export function listarPedidos(f: { canal?: Canal; estado?: Estado } = {}): Pedido[] {
	const db = getDb();
	return armar(
		db,
		db
			.select()
			.from(pedidos)
			.where(
				and(
					eq(pedidos.fecha, fechaNegocio()),
					f.canal ? eq(pedidos.canal, f.canal) : undefined,
					f.estado ? eq(pedidos.estado, f.estado) : undefined
				)
			)
			.orderBy(desc(pedidos.turno))
			.all()
	);
}

/** Insumos que consume una línea: receta del producto + de cada opción, por cantidad. */
function consumo(tx: Tx, items: { productoId: number; cantidad: number; opcionIds: number[] }[]) {
	const total = new Map<number, number>();
	const sumar = (insumoId: number, n: number) => total.set(insumoId, (total.get(insumoId) ?? 0) + n);
	for (const it of items) {
		const rs = tx
			.select()
			.from(recetas)
			.where(
				it.opcionIds.length
					? sql`${recetas.productoId} = ${it.productoId} OR ${inArray(recetas.opcionId, it.opcionIds)}`
					: eq(recetas.productoId, it.productoId)
			)
			.all();
		for (const r of rs) sumar(r.insumoId, r.cantidad * it.cantidad);
	}
	return total;
}

/**
 * Crea el pedido en una sola transacción: turno, líneas, descuento de insumos y bitácora.
 * Idempotente por externoId: si ya existe devuelve el mismo pedido con creado=false.
 * El precio sale siempre de la DB, nunca del cliente.
 */
export function crearPedido(input: CrearPedidoInput): { pedido: Pedido; creado: boolean } {
	const db = getDb();
	const tocados = new Set<number>();

	const r = db.transaction(
		(tx) => {
			if (input.externoId) {
				const [previo] = tx.select().from(pedidos).where(eq(pedidos.externoId, input.externoId)).all();
				if (previo) return { pedido: obtenerPedido(previo.id, tx)!, creado: false };
			}

			const prods = tx
				.select()
				.from(productos)
				.where(
					inArray(
						productos.id,
						input.items.map((i) => i.productoId)
					)
				)
				.all();
			const ids = input.items.flatMap((i) => i.opcionIds);
			const ops = ids.length ? tx.select().from(opciones).where(inArray(opciones.id, ids)).all() : [];

			let total = 0;
			const lineas = input.items.map((it) => {
				const p = prods.find((x) => x.id === it.productoId);
				if (!p)
					throw new ErrorNegocio('Un producto del ticket ya no existe en el menú (el catálogo se actualizó). Quítalo y vuelve a agregarlo.');
				if (!p.activo) throw new ErrorNegocio(`${p.nombre} está pausado en el menú. Quítalo del ticket o actívalo en el portal.`);
				const elegidas = it.opcionIds.map((oid) => {
					const o = ops.find((x) => x.id === oid && x.productoId === p.id);
					if (!o) throw new ErrorNegocio(`Una opción de ${p.nombre} ya no existe en el menú. Quita ${p.nombre} y vuelve a agregarlo.`);
					return o;
				});
				const unicas = elegidas.filter((o) => o.tipo === 'unica').map((o) => o.grupo);
				if (new Set(unicas).size !== unicas.length)
					throw new ErrorNegocio(`Solo puedes elegir una opción por grupo en ${p.nombre}`);
				const precioUnit = p.precio + elegidas.reduce((s, o) => s + o.precioExtra, 0);
				total += precioUnit * it.cantidad;
				return { it, p, elegidas, precioUnit };
			});

			const fecha = fechaNegocio();
			const turno = siguienteTurno(tx, fecha);
			const externoPagado = input.canal !== 'kiosco' && input.canal !== 'caja';
			const [fila] = tx
				.insert(pedidos)
				.values({
					fecha,
					turno,
					canal: input.canal,
					externoId: input.externoId,
					cliente: input.cliente,
					telefono: input.telefono,
					pagoMetodo: input.pagoMetodo,
					pagoEstado: externoPagado ? 'pagado' : 'pendiente',
					// Pagado = la cocina lo prepara de inmediato; no hay paso "Empezar a preparar".
					estado: externoPagado ? 'preparando' : 'nuevo',
					total,
					notas: input.notas
				})
				.returning()
				.all();

			tx.insert(pedidoItems)
				.values(
					lineas.map(({ it, p, elegidas, precioUnit }) => ({
						pedidoId: fila.id,
						productoId: p.id,
						nombre: p.nombre,
						cantidad: it.cantidad,
						precioUnit,
						opciones: elegidas.map((o) => ({ id: o.id, nombre: o.nombre, precioExtra: o.precioExtra })),
						notas: it.notas
					}))
				)
				.run();

			for (const [insumoId, cantidad] of consumo(
				tx,
				input.items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad, opcionIds: i.opcionIds }))
			)) {
				if (cantidad === 0) continue;
				moverStock(tx, insumoId, -cantidad, 'consumo', { pedidoId: fila.id });
				tocados.add(insumoId);
			}
			return { pedido: obtenerPedido(fila.id, tx)!, creado: true };
		},
		{ behavior: 'immediate' }
	);

	if (r.creado) {
		emitir('pedido.creado', r.pedido);
		for (const id of tocados) emitir('insumo.actualizado', obtenerInsumo(id)!);
	}
	return r;
}

function publicar(p: Pedido) {
	emitir('pedido.actualizado', p);
}

function requerir(id: number): Pedido {
	const p = obtenerPedido(id);
	if (!p) throw new ErrorNegocio('Pedido no encontrado', 404);
	return p;
}

function tocar(id: number, set: Partial<typeof pedidos.$inferInsert>) {
	getDb()
		.update(pedidos)
		.set({ ...set, actualizadoEn: Date.now() })
		.where(eq(pedidos.id, id))
		.run();
}

/** Confirma el cobro (efectivo o transferencia en caja, o tarjeta ya aprobada). Idempotente. */
export function confirmarPago(id: number, metodo?: PagoMetodo): Pedido {
	const p = requerir(id);
	if (p.estado === 'cancelado') throw new ErrorNegocio('El pedido está cancelado', 409);
	if (p.pagoEstado === 'pagado' && !metodo) return p;
	tocar(id, { pagoEstado: 'pagado', ...(p.estado === 'nuevo' && { estado: 'preparando' as const }), ...(metodo && { pagoMetodo: metodo }) });
	const nuevo = obtenerPedido(id)!;
	publicar(nuevo);
	return nuevo;
}

export function cambiarEstado(id: number, estado: Estado): Pedido {
	if (estado === 'cancelado') return cancelar(id);
	const p = requerir(id);
	if (p.estado === estado) return p;
	if (p.estado === 'cancelado' || p.estado === 'entregado')
		throw new ErrorNegocio(`El pedido ya está ${p.estado}`, 409);
	if (p.pagoEstado === 'pendiente') throw new ErrorNegocio('El pedido aún no está pagado', 409);
	tocar(id, { estado });
	const nuevo = obtenerPedido(id)!;
	publicar(nuevo);
	if (estado === 'listo') emitir('turno.listo', { turno: nuevo.turno, pedidoId: id });
	return nuevo;
}

/** Cancela y devuelve al inventario lo que se había descontado (lo no revertido aún). */
export function cancelar(id: number): Pedido {
	const db = getDb();
	const p = requerir(id);
	if (p.estado === 'cancelado') return p;
	if (p.estado === 'entregado') throw new ErrorNegocio('Un pedido entregado no se puede cancelar', 409);
	const tocados: number[] = [];
	db.transaction(
		(tx) => {
			const netos = tx
				.select({ insumoId: movimientosInsumo.insumoId, neto: sql<number>`sum(${movimientosInsumo.cantidad})` })
				.from(movimientosInsumo)
				.where(
					and(eq(movimientosInsumo.pedidoId, id), inArray(movimientosInsumo.tipo, ['consumo', 'reversa']))
				)
				.groupBy(movimientosInsumo.insumoId)
				.all();
			for (const n of netos)
				if (n.neto !== 0) {
					moverStock(tx, n.insumoId, -n.neto, 'reversa', { pedidoId: id, nota: 'Pedido cancelado' });
					tocados.push(n.insumoId);
				}
			tx.update(pedidos).set({ estado: 'cancelado', actualizadoEn: Date.now() }).where(eq(pedidos.id, id)).run();
		},
		{ behavior: 'immediate' }
	);
	const nuevo = obtenerPedido(id)!;
	publicar(nuevo);
	for (const i of tocados) emitir('insumo.actualizado', obtenerInsumo(i)!);
	return nuevo;
}
