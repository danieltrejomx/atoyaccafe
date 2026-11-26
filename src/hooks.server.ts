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

const SIN_PIN = { id: 1, nombre: 'Administración', rol: 'admin' } as const;

export const handle: Handle = async ({ event, resolve }) => {
	// Sin PIN por decisión del cliente (26-nov-2026): todos entran como admin, el portal queda abierto a quien tenga la URL.
	event.locals.usuario = leerToken(event.cookies.get(COOKIE)) ?? SIN_PIN;
	if (event.url.pathname === '/portal/login') return new Response(null, { status: 303, headers: { location: '/portal' } });
	return proteger(event) ?? resolve(event);
};
