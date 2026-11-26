import { ticketSchema } from '$lib/kiosco/esquemas';
import { cuerpo, ErrorNegocio, manejar } from '$lib/server/http';
import { obtenerPedido } from '$lib/server/pedidos';
import { enviarTicket } from '$lib/server/whatsapp';
import type { RequestHandler } from './$types';

const enviados = new Set<number>();

/** Público, así que se acota: solo pedidos de kiosco recientes y un ticket por pedido. */
export const POST: RequestHandler = ({ request }) =>
	manejar(async () => {
		const { pedidoId, telefono } = ticketSchema.parse(await cuerpo(request));
		const p = obtenerPedido(pedidoId);
		if (!p || p.canal !== 'kiosco' || Date.now() - p.creadoEn > 30 * 60_000)
			throw new ErrorNegocio('Pedido no encontrado', 404);
		if (enviados.has(pedidoId)) throw new ErrorNegocio('El ticket ya se envió', 409);
		enviados.add(pedidoId);
		const ok = await enviarTicket(`52${telefono}`, p);
		if (!ok) {
			enviados.delete(pedidoId);
			throw new ErrorNegocio('No pudimos enviar el ticket. Tu turno sigue siendo el ' + p.turno, 502);
		}
		return { ok: true };
	});
