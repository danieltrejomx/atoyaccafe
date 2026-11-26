import { patchPedidoSchema } from '$lib/schemas';
import { exigirRol } from '$lib/server/auth';
import { cuerpo, ErrorNegocio, manejar } from '$lib/server/http';
import { cambiarEstado, confirmarPago, obtenerPedido } from '$lib/server/pedidos';
import type { RequestHandler } from './$types';

const idDe = (v: string) => {
	const n = Number(v);
	if (!Number.isInteger(n) || n < 1) throw new ErrorNegocio('Id inválido');
	return n;
};

export const GET: RequestHandler = ({ params }) =>
	manejar(() => {
		const p = obtenerPedido(idDe(params.id));
		if (!p) throw new ErrorNegocio('Pedido no encontrado', 404);
		return p;
	});

/** { estado } cambia el estado (cancelado revierte insumos); { pagado: true, pagoMetodo? } confirma el cobro. */
export const PATCH: RequestHandler = ({ params, request, locals }) =>
	manejar(async () => {
		const id = idDe(params.id);
		const { estado, pagado, pagoMetodo } = patchPedidoSchema.parse(await cuerpo(request));
		if (pagado) {
			exigirRol(locals, 'admin', 'caja');
			confirmarPago(id, pagoMetodo);
		}
		return estado ? cambiarEstado(id, estado) : obtenerPedido(id);
	});
