import { redirect } from '@sveltejs/kit';
import { permitido } from '$lib/portal/acceso';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, url }) => {
	const usuario = locals.usuario;
	if (usuario && !permitido(usuario.rol, url.pathname)) redirect(303, '/portal');
	return { usuario };
};
