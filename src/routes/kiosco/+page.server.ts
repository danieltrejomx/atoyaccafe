import '$lib/server/env'; // carga .env en desarrollo
import { listarProductos } from '$lib/server/productos';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ productos: listarProductos(), clabe: process.env.PUBLIC_CLABE ?? '' });
