import { json } from '@sveltejs/kit';
import { crearPedidoSchema, pedidosQuerySchema } from '$lib/schemas';
import { cuerpo, ErrorNegocio, manejar } from '$lib/server/http';
import { crearPedido, listarPedidos } from '$lib/server/pedidos';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) =>
	manejar(() => listarPedidos(pedidosQuerySchema.parse(Object.fromEntries(url.searchParams))));

/** Público solo para canal "kiosco" (siempre queda pago pendiente hasta que cobro o caja lo confirmen). */
export const POST: RequestHandler = ({ request, locals }) =>
	manejar(async () => {
		const input = crearPedidoSchema.parse(await cuerpo(request));
		if (!locals.usuario && input.canal !== 'kiosco') throw new ErrorNegocio('Inicia sesión', 401);
		const { pedido, creado } = crearPedido(input);
		return json(pedido, { status: creado ? 201 : 200 });
	});
