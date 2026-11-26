import { cancelarCobro, consultarCobro } from '$lib/server/cobro-mp';
import { manejar } from '$lib/server/http';
import { soltarPedido } from '$lib/server/cobro';
import { confirmarPago } from '$lib/server/pedidos';
import type { RequestHandler } from './$types';

/** Sondeo del kiosco. Al aprobarse en Mercado Pago, el servidor marca el pedido como pagado. */
export const GET: RequestHandler = ({ params }) =>
	manejar(async () => {
		const c = await consultarCobro(params.id);
		if (c.estado === 'aprobado') confirmarPago(c.pedidoId, 'tarjeta');
		else if (c.estado !== 'pendiente') soltarPedido(c.pedidoId);
		return { ordenId: c.ordenId, estado: c.estado };
	});

/** El cliente cancela el cobro en el kiosco. */
export const DELETE: RequestHandler = ({ params }) =>
	manejar(async () => {
		const c = await consultarCobro(params.id);
		if (c.estado === 'pendiente') {
			await cancelarCobro(params.id);
			soltarPedido(c.pedidoId);
		}
		return { ok: true };
	});
