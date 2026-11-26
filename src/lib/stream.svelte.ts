// Envoltorio de EventSource con reconexión automática (backoff 1s a 15s) y estado reactivo.
import type { EventosSSE, NombreEvento } from './types';

type Manejadores = { [K in NombreEvento]?: (data: EventosSSE[K]) => void };

const EVENTOS: NombreEvento[] = ['pedido.creado', 'pedido.actualizado', 'turno.listo', 'insumo.actualizado'];

/**
 * Uso en un componente:
 *   const s = crearStream({ 'turno.listo': (d) => ..., 'pedido.actualizado': () => recargar() },
 *                         { alAbrir: recargar });   // alAbrir corre en CADA conexión: recarga el snapshot
 *   onMount(() => { s.abrir(); return s.cerrar; });
 *   s.conectado  // reactivo, para el chip "Reconectando…"
 */
export function crearStream(manejadores: Manejadores, opts: { url?: string; alAbrir?: () => void } = {}) {
	let conectado = $state(false);
	let es: EventSource | undefined;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let intentos = 0;
	let activo = false;

	function abrir() {
		activo = true;
		clearTimeout(timer);
		es?.close();
		es = new EventSource(opts.url ?? '/api/stream');
		es.onopen = () => {
			conectado = true;
			intentos = 0;
			opts.alAbrir?.();
		};
		es.onerror = () => {
			conectado = false;
			es?.close();
			if (activo) timer = setTimeout(abrir, Math.min(1000 * 2 ** intentos++, 15_000));
		};
		for (const nombre of EVENTOS) {
			es.addEventListener(nombre, (e) => {
				try {
					(manejadores[nombre] as ((d: unknown) => void) | undefined)?.(JSON.parse((e as MessageEvent).data));
				} catch {
					/* mensaje mal formado: se ignora */
				}
			});
		}
	}

	function cerrar() {
		activo = false;
		clearTimeout(timer);
		es?.close();
		conectado = false;
	}

	return {
		get conectado() {
			return conectado;
		},
		abrir,
		cerrar
	};
}
