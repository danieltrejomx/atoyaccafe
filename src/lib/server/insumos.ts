import { eq, sql } from 'drizzle-orm';
import type { InsumoPatchInput } from '../schemas';
import type { Insumo, MovimientoTipo } from '../types';
import { getDb, schema, type Db, type Tx } from './db';
import { ErrorNegocio } from './http';
import { emitir } from './sse';

const { insumos, movimientosInsumo } = schema;

function aInsumo(r: typeof insumos.$inferSelect): Insumo {
	return {
		id: r.id,
		nombre: r.nombre,
		unidad: r.unidad,
		stock: Math.round(r.stock * 1000) / 1000,
		minimo: r.minimo,
		frecuencia: r.frecuencia,
		bajoMinimo: r.stock <= r.minimo
	};
}

export function listarInsumos(): Insumo[] {
	return getDb().select().from(insumos).orderBy(insumos.nombre).all().map(aInsumo);
}

export function bajoMinimo(): Insumo[] {
	return listarInsumos().filter((i) => i.bajoMinimo);
}

export function obtenerInsumo(id: number): Insumo | undefined {
	const [r] = getDb().select().from(insumos).where(eq(insumos.id, id)).all();
	return r && aInsumo(r);
}

/** Mueve el stock y deja rastro en la bitácora. `delta` lleva signo. Sin emitir evento (lo hace quien llama). */
export function moverStock(
	tx: Db | Tx,
	insumoId: number,
	delta: number,
	tipo: MovimientoTipo,
	extra: { pedidoId?: number; nota?: string } = {}
) {
	tx.update(insumos)
		.set({ stock: sql`${insumos.stock} + ${delta}` })
		.where(eq(insumos.id, insumoId))
		.run();
	tx.insert(movimientosInsumo)
		.values({ insumoId, tipo, cantidad: delta, pedidoId: extra.pedidoId, nota: extra.nota })
		.run();
}

/** Ajuste manual (delta con signo), merma (resta) o compra (suma), o cambio de mínimo. */
export function actualizarInsumo(input: InsumoPatchInput): Insumo {
	const db = getDb();
	if (!obtenerInsumo(input.id)) throw new ErrorNegocio('Insumo no encontrado', 404);
	db.transaction((tx) => {
		if (input.minimo !== undefined)
			tx.update(insumos).set({ minimo: input.minimo }).where(eq(insumos.id, input.id)).run();
		if (input.tipo && input.cantidad) {
			const delta = input.tipo === 'merma' ? -Math.abs(input.cantidad) : input.cantidad;
			if (input.tipo === 'compra' && delta < 0)
				throw new ErrorNegocio('Una compra debe ser positiva');
			moverStock(tx, input.id, delta, input.tipo, { nota: input.nota });
		}
	});
	const actualizado = obtenerInsumo(input.id)!;
	emitir('insumo.actualizado', actualizado);
	return actualizado;
}
