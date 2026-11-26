import { cobroSchema } from '$lib/kiosco/esquemas';
import { iniciarCobro } from '$lib/server/cobro-mp';
import { soltarPedido } from '$lib/server/cobro';
import { cuerpo, ErrorNegocio, manejar } from '$lib/server/http';
import { obtenerPedido } from '$lib/server/pedidos';
import type { RequestHandler } from './$types';

/** Público: el monto sale del pedido en la DB, nunca del cliente. */
export const POST: RequestHandler = ({ request }) =>
	manejar(async () => {
		const { pedidoId } = cobroSchema.parse(await cuerpo(request));
		const p = obtenerPedido(pedidoId);
		if (!p) throw new ErrorNegocio('Pedido no encontrado', 404);
		if (p.canal !== 'kiosco' || p.pagoMetodo !== 'tarjeta' || p.pagoEstado !== 'pendiente' || p.estado === 'cancelado')
			throw new ErrorNegocio('Este pedido no se puede cobrar con tarjeta', 409);
		try {
			return await iniciarCobro(p.id, p.total);
		} catch (e) {
			soltarPedido(p.id); // la terminal no respondió: no dejar el pedido colgado en caja
			throw e;
		}
	});
