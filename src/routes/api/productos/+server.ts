import { manejar } from '$lib/server/http';
import { listarProductos } from '$lib/server/productos';
import type { RequestHandler } from './$types';

/** ?todos=1 (solo con sesión) incluye productos inactivos. */
export const GET: RequestHandler = ({ url, locals }) =>
	manejar(() => listarProductos(!(url.searchParams.get('todos') && locals.usuario)));
