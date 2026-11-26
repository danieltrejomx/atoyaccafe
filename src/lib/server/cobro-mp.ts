// Cobro con terminal Mercado Pago Point (API /v1/orders). Credenciales solo de env (MP_TOKEN, MP_TERMINAL).
// Sin credenciales y fuera de producción responde en modo simulado: nunca toca la API real.
import { randomUUID } from 'node:crypto';
import { env } from './env';
import { ErrorNegocio } from './http';

export interface CobroMP {
	/** id de la orden en Mercado Pago */
	ordenId: string;
	estado: 'pendiente' | 'aprobado' | 'rechazado' | 'cancelado';
	/** external_reference de la orden: el id del pedido */
	pedidoId: number;
}

const API = 'https://api.mercadopago.com/v1/orders';
const simulado = () => !env.mpToken || !env.mpTerminal;
/** Simulado: ordenId -> { pedidoId, creada, cancelada }. Se aprueba a los 4 s. */
const mock = new Map<string, { pedidoId: number; t: number; cancelada?: boolean }>();

function estadoDe(status: string): CobroMP['estado'] {
	if (status === 'processed' || status === 'closed') return 'aprobado';
	if (status === 'canceled' || status === 'expired') return 'cancelado';
	if (status === 'failed') return 'rechazado';
	return 'pendiente';
}

async function mp(url: string, init: RequestInit = {}) {
	const r = await fetch(url, {
		...init,
		headers: { Authorization: `Bearer ${env.mpToken}`, 'Content-Type': 'application/json', ...init.headers },
		signal: AbortSignal.timeout(15_000)
	});
	const data = await r.json().catch(() => ({}));
	if (!r.ok) {
		console.error('Mercado Pago', r.status, JSON.stringify(data).slice(0, 300));
		throw new ErrorNegocio('No se pudo contactar la terminal. Intenta de nuevo.', 502);
	}
	return data as { id: string; status: string; external_reference?: string };
}

const aCobro = (d: { id: string; status: string; external_reference?: string }): CobroMP => ({
	ordenId: d.id,
	estado: estadoDe(d.status),
	pedidoId: Number(d.external_reference)
});

/** Envía el monto (pesos) a la terminal Point; la referencia externa es el id del pedido. */
export async function iniciarCobro(pedidoId: number, monto: number): Promise<CobroMP> {
	if (simulado()) {
		if (env.prod) throw new ErrorNegocio('La terminal de tarjeta no está configurada', 503);
		const ordenId = `sim-${randomUUID()}`;
		mock.set(ordenId, { pedidoId, t: Date.now() });
		return { ordenId, estado: 'pendiente', pedidoId };
	}
	return aCobro(
		await mp(API, {
			method: 'POST',
			headers: { 'X-Idempotency-Key': `atoyac_${randomUUID()}` },
			body: JSON.stringify({
				type: 'point',
				external_reference: String(pedidoId),
				transactions: { payments: [{ amount: monto.toFixed(2) }] },
				config: { point: { terminal_id: env.mpTerminal } }
			})
		})
	);
}

/** Consulta el estado de una orden ya iniciada. */
export async function consultarCobro(ordenId: string): Promise<CobroMP> {
	if (simulado()) {
		const m = mock.get(ordenId);
		if (!m) throw new ErrorNegocio('Cobro no encontrado', 404);
		const estado = m.cancelada ? 'cancelado' : Date.now() - m.t > 4000 ? 'aprobado' : 'pendiente';
		return { ordenId, estado, pedidoId: m.pedidoId };
	}
	return aCobro(await mp(`${API}/${encodeURIComponent(ordenId)}`));
}

/** Cancela la orden en la terminal (el cliente se arrepintió). */
export async function cancelarCobro(ordenId: string): Promise<void> {
	if (simulado()) {
		const m = mock.get(ordenId);
		if (m) m.cancelada = true;
		return;
	}
	await mp(`${API}/${encodeURIComponent(ordenId)}/cancel`, { method: 'POST' });
}
