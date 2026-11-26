// Estado vivo de los pedidos del día: carga inicial, SSE y acciones de la tarjeta.
import { api } from '$lib/api';
import { crearStream } from '$lib/stream.svelte';
import type { Pedido } from '$lib/types';
import { SIGUIENTE } from './acceso';

export function pedidosVivos(alNuevo?: (p: Pedido) => void) {
	let lista = $state<Pedido[]>([]);
	let error = $state('');
	let ahora = $state(Date.now());
	let primera = true;

	const poner = (p: Pedido) => (lista = [p, ...lista.filter((x) => x.id !== p.id)]);
	const recargar = () =>
		api.pedidos().then((r) => ((lista = r), (primera = false)), (e) => (error = e.message));
	const stream = crearStream(
		{
			'pedido.creado': (p) => {
				poner(p);
				if (!primera) alNuevo?.(p);
			},
			'pedido.actualizado': poner
		},
		{ alAbrir: recargar }
	);

	async function accion(tipo: 'avanzar' | 'cancelar' | 'cobrar', p: Pedido) {
		error = '';
		try {
			if (tipo === 'cancelar') {
				if (!confirm(`¿Cancelar el turno ${p.turno}?`)) return;
				poner(await api.cambiarEstado(p.id, 'cancelado'));
			} else if (tipo === 'cobrar') poner(await api.confirmarPago(p.id));
			else poner(await api.cambiarEstado(p.id, SIGUIENTE[p.estado]!.estado));
		} catch (e) {
			error = (e as Error).message;
		}
	}

	return {
		get lista() { return lista; },
		get error() { return error; },
		set error(v: string) { error = v; },
		get ahora() { return ahora; },
		get conectado() { return stream.conectado; },
		accion,
		recargar,
		/** Abre SSE y el reloj; devolver desde onMount. */
		iniciar() {
			stream.abrir();
			const t = setInterval(() => (ahora = Date.now()), 15000);
			return () => (stream.cerrar(), clearInterval(t));
		}
	};
}
