import { crearApi } from '$lib/api';
import type { Producto } from '$lib/types';
import type { PageLoad } from './$types';

// Un destacado por categoría (los que tienen foto) para el inicio.
export const load: PageLoad = async ({ fetch }) => {
	const vistos = new Set<string>();
	const destacados = (await crearApi(fetch).productos().catch((): Producto[] => []))
		.filter((p) => p.foto && p.disponible && !vistos.has(p.categoria) && vistos.add(p.categoria))
		.slice(0, 4);
	return { destacados };
};
