import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import type { TurnosRespuesta } from '../types';
import { getDb, schema, type Db, type Tx } from './db';
import { env } from './env';

const { pedidos, pedidoItems } = schema;

/** Fecha del negocio (YYYY-MM-DD) en la zona horaria del café; el turno se reinicia cada día. */
export function fechaNegocio(ts = Date.now()): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: env.tz }).format(ts);
}

/** Debe llamarse dentro de una transacción inmediata para que no se repita el número. */
export function siguienteTurno(tx: Db | Tx, fecha: string): number {
	const [r] = tx
		.select({ turno: pedidos.turno })
		.from(pedidos)
		.where(eq(pedidos.fecha, fecha))
		.orderBy(desc(pedidos.turno))
		.limit(1)
		.all();
	return (r?.turno ?? 0) + 1;
}

/** Solo cuentan pedidos ya pagados: el pago pendiente aún no entra a cocina. */
export function turnosActuales(): TurnosRespuesta {
	const db = getDb();
	const filas = db
		.select()
		.from(pedidos)
		.where(
			and(
				eq(pedidos.fecha, fechaNegocio()),
				eq(pedidos.pagoEstado, 'pagado'),
				inArray(pedidos.estado, ['nuevo', 'preparando', 'listo'])
			)
		)
		.orderBy(asc(pedidos.turno))
		.all();

	const enEspera = filas.filter((p) => p.estado !== 'listo');
	const actual = enEspera.find((p) => p.estado === 'preparando') ?? enEspera[0];
	const productos = actual
		? db
				.select({ nombre: pedidoItems.nombre, cantidad: pedidoItems.cantidad })
				.from(pedidoItems)
				.where(eq(pedidoItems.pedidoId, actual.id))
				.all()
				.map((i) => (i.cantidad > 1 ? `${i.cantidad} x ${i.nombre}` : i.nombre))
		: [];

	return {
		actual: actual
			? { turno: actual.turno, pedidoId: actual.id, estado: actual.estado, productos }
			: null,
		proximos: enEspera.filter((p) => p !== actual).slice(0, 3).map((p) => p.turno),
		listos: filas
			.filter((p) => p.estado === 'listo')
			.sort((a, b) => b.actualizadoEn - a.actualizadoEn)
			.slice(0, 5)
			.map((p) => p.turno)
	};
}
