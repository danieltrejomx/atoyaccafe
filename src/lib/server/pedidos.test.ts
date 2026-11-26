import './testdb';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { fixture, stock } from './testdb';
import { cancelar, cambiarEstado, confirmarPago, crearPedido } from './pedidos';
import { cerrarDb, getDb, schema } from './db';
import { turnosActuales } from './turnos';
import { suscribir } from './sse';

let f: Awaited<ReturnType<typeof fixture>>;
const kiosco = (extra = {}) => ({
	canal: 'kiosco' as const,
	items: [{ productoId: f.panini.id, cantidad: 2, opcionIds: [f.opCroissant.id] }],
	...extra
});

beforeAll(async () => {
	f = await fixture();
});
afterEach(() => vi.useRealTimers());
afterAll(() => cerrarDb());

describe('turno diario', () => {
	it('asigna turnos consecutivos y se reinicia al día siguiente', () => {
		vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-12-05T15:00:00Z') });
		const t = [1, 2, 3].map(() => crearPedido({ canal: 'caja', items: [{ productoId: f.jugo.id, cantidad: 1, opcionIds: [] }] }).pedido.turno);
		expect(t).toEqual([1, 2, 3]);
		vi.setSystemTime(new Date('2026-12-06T15:00:00Z'));
		const manana = crearPedido({ canal: 'caja', items: [{ productoId: f.jugo.id, cantidad: 1, opcionIds: [] }] }).pedido;
		expect(manana.turno).toBe(1);
		expect(manana.fecha).toBe('2026-12-06');
	});
});

describe('recetas e inventario', () => {
	it('descuenta producto y opciones por cantidad, calcula el precio en el servidor y registra movimientos', async () => {
		const [pan, queso, cro] = [await stock(f.pan.id), await stock(f.queso.id), await stock(f.croissant.id)];
		const { pedido } = crearPedido(kiosco());
		expect(pedido.total).toBe((65 + 10) * 2);
		expect(await stock(f.pan.id)).toBe(pan - 2);
		expect(await stock(f.queso.id)).toBeCloseTo(queso - 0.1);
		expect(await stock(f.croissant.id)).toBe(cro - 2);
		const movs = getDb().select().from(schema.movimientosInsumo).all().filter((m) => m.pedidoId === pedido.id);
		expect(movs).toHaveLength(3);
		expect(movs.every((m) => m.tipo === 'consumo' && m.cantidad < 0)).toBe(true);
	});

	it('cancelar revierte el descuento una sola vez', async () => {
		const antes = [await stock(f.pan.id), await stock(f.queso.id), await stock(f.croissant.id)];
		const { pedido } = crearPedido(kiosco());
		cancelar(pedido.id);
		cancelar(pedido.id);
		const despues = [await stock(f.pan.id), await stock(f.queso.id), await stock(f.croissant.id)];
		despues.forEach((d, i) => expect(d).toBeCloseTo(antes[i]));
		expect(getDb().select().from(schema.pedidos).all().find((p) => p.id === pedido.id)?.estado).toBe('cancelado');
	});

	it('rechaza dos opciones del mismo grupo y opciones de otro producto', () => {
		expect(() => crearPedido(kiosco({ items: [{ productoId: f.panini.id, cantidad: 1, opcionIds: [f.opCroissant.id, f.opArtesanal.id] }] }))).toThrow(/una opción por grupo/);
		expect(() => crearPedido(kiosco({ items: [{ productoId: f.jugo.id, cantidad: 1, opcionIds: [f.opCroissant.id] }] }))).toThrow(/Una opción de Jugo ya no existe/);
	});
});

describe('idempotencia por externoId', () => {
	it('el mismo externoId no crea otro pedido ni vuelve a descontar', async () => {
		const antes = await stock(f.pan.id);
		const a = crearPedido(kiosco({ canal: 'rappi', externoId: 'rappi:777' }));
		const b = crearPedido(kiosco({ canal: 'rappi', externoId: 'rappi:777' }));
		expect(a.creado).toBe(true);
		expect(b.creado).toBe(false);
		expect(b.pedido.id).toBe(a.pedido.id);
		expect(await stock(f.pan.id)).toBe(antes - 2);
		expect(getDb().select().from(schema.pedidos).all().filter((p) => p.externoId === 'rappi:777')).toHaveLength(1);
	});
});

describe('flujo de estados y turnos', () => {
	it('pago pendiente no entra a cocina; al pagar aparece en la TV y "listo" emite turno.listo', () => {
		const eventos: string[] = [];
		const baja = suscribir((e) => eventos.push(e));
		const { pedido } = crearPedido(kiosco({ canal: 'kiosco' }));
		expect(pedido.pagoEstado).toBe('pendiente');
		expect(() => cambiarEstado(pedido.id, 'preparando')).toThrow(/pagado/);
		expect(turnosActuales().actual?.pedidoId).not.toBe(pedido.id);

		confirmarPago(pedido.id, 'efectivo');
		const tv = turnosActuales();
		expect([tv.actual?.turno, ...tv.proximos]).toContain(pedido.turno);

		cambiarEstado(pedido.id, 'preparando');
		cambiarEstado(pedido.id, 'listo');
		expect(turnosActuales().listos).toContain(pedido.turno);
		expect(eventos).toContain('turno.listo');
		baja();
		expect(() => cancelar(cambiarEstado(pedido.id, 'entregado').id)).toThrow(/entregado/);
	});
});

describe('cobro manda a cocina', () => {
	it('un pedido pagado entra directo a preparando, sin paso manual', () => {
		const { pedido } = crearPedido(kiosco());
		expect(pedido.estado).toBe('nuevo');
		expect(confirmarPago(pedido.id, 'efectivo').estado).toBe('preparando');
		const app = crearPedido({ canal: 'interno', items: [{ productoId: f.jugo.id, cantidad: 1, opcionIds: [] }] }).pedido;
		expect(app.estado).toBe('preparando');
	});
});

describe('mensajes de error', () => {
	it('nombran el producto y el motivo, nunca el id', () => {
		expect(() => crearPedido(kiosco({ items: [{ productoId: 99999, cantidad: 1, opcionIds: [] }] }))).toThrow(/ya no existe en el menú/);
		expect(() => crearPedido(kiosco({ items: [{ productoId: 99999, cantidad: 1, opcionIds: [] }] }))).not.toThrow(/99999/);
	});
});
