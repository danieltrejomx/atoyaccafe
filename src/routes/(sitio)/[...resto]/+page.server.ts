import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// URLs del sitio anterior. Lo que no está aquí es un 404 normal.
const ALIAS: Record<string, string> = {
	inicio: '/', index: '/', productos: '/menu', menu: '/menu', nosotros: '/nosotros', delivery: '/delivery',
	inauguracion: '/inauguracion', 'punto-de-venta': '/kiosco', ipad: '/kiosco', kiosco: '/kiosco',
	pos: '/portal', caja: '/portal', kds: '/portal', cocina: '/portal', admin: '/portal', portal: '/portal'
};

export const load: PageServerLoad = ({ params }) => {
	const destino = ALIAS[params.resto.replace(/\.html$/, '').replace(/\/$/, '')];
	if (destino) redirect(301, destino);
	error(404, 'No encontramos esta página.');
};
