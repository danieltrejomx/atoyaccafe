import type { EventosSSE, NombreEvento } from '../types';

type Oyente = (evento: NombreEvento, data: EventosSSE[NombreEvento]) => void;

// globalThis: una sola instancia aunque Vite recargue módulos en dev.
const g = globalThis as unknown as { __atoyacOyentes?: Set<Oyente> };
const oyentes = (g.__atoyacOyentes ??= new Set<Oyente>());

export function emitir<K extends NombreEvento>(evento: K, data: EventosSSE[K]) {
	for (const o of oyentes) {
		try {
			o(evento, data);
		} catch {
			/* un cliente roto no debe frenar a los demás */
		}
	}
}

/** Devuelve la función para darse de baja. */
export function suscribir(oyente: Oyente): () => void {
	oyentes.add(oyente);
	return () => oyentes.delete(oyente);
}
