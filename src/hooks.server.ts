import type { Handle, ServerInit } from '@sveltejs/kit/hooks';
import { COOKIE, leerToken, proteger } from '$lib/server/auth';
import { iniciarCanales } from '$lib/server/canales';
import { getDb } from '$lib/server/db';
import { validarEnv } from '$lib/server/env';

// Abre la DB y corre las migraciones al arrancar el servidor (no durante el build).
export const init: ServerInit = () => {
	validarEnv();
	getDb();
	iniciarCanales();
};

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.usuario = leerToken(event.cookies.get(COOKIE));
	return proteger(event) ?? resolve(event);
};
