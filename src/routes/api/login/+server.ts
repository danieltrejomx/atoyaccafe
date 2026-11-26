import { loginSchema } from '$lib/schemas';
import { login, ponerCookie } from '$lib/server/auth';
import { cuerpo, ErrorNegocio, manejar } from '$lib/server/http';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, cookies, url, getClientAddress }) =>
	manejar(async () => {
		const { pin } = loginSchema.parse(await cuerpo(request));
		const usuario = login(pin, getClientAddress());
		if (!usuario) throw new ErrorNegocio('PIN incorrecto', 401);
		ponerCookie(cookies, url, usuario);
		return usuario;
	});
