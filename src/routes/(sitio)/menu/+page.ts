import { crearApi } from '$lib/api';
import { CATEGORIAS, type Producto } from '$lib/types';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	let productos: Producto[] = [];
	let error = false;
	try {
		productos = await crearApi(fetch).productos();
	} catch {
		error = true;
	}
	const grupos = CATEGORIAS.map((c) => ({ categoria: c, productos: productos.filter((p) => p.categoria === c) })).filter((g) => g.productos.length);
	return { grupos, error };
};
