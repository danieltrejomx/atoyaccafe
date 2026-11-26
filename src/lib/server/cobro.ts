import { cancelar, obtenerPedido } from './pedidos';

/** Libera el pedido si el cobro no se concretó (devuelve insumos y lo saca de caja). */
export function soltarPedido(pedidoId: number) {
	const p = obtenerPedido(pedidoId);
	if (p && p.pagoEstado === 'pendiente' && p.estado !== 'cancelado') cancelar(pedidoId);
}
