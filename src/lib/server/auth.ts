import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import type { Rol } from '../types';
import { ROLES } from '../types';
import { getDb, schema } from './db';
import { env } from './env';
import { ErrorNegocio } from './http';

export const COOKIE = 'atoyac_sesion';
const DURACION_MS = 12 * 60 * 60 * 1000;

type Sesion = { id: number; nombre: string; rol: Rol };

export function hashPin(pin: string): string {
	const sal = randomBytes(16);
	return `${sal.toString('hex')}:${scryptSync(pin, sal, 32).toString('hex')}`;
}

export function verificarPin(pin: string, guardado: string): boolean {
	const [sal, hash] = guardado.split(':');
	if (!sal || !hash) return false;
	const esperado = Buffer.from(hash, 'hex');
	return timingSafeEqual(scryptSync(pin, Buffer.from(sal, 'hex'), esperado.length), esperado);
}

// Freno a la fuerza bruta: 5 fallos por origen y bloqueo de 1 minuto (en memoria, un solo proceso).
const fallos = new Map<string, { n: number; hasta: number }>();

/** Devuelve el usuario cuyo PIN coincide, o null. Lanza 429 si el origen está bloqueado. */
export function login(pin: string, origen = 'local'): Sesion | null {
	const f = fallos.get(origen);
	if (f && f.hasta > Date.now()) throw new ErrorNegocio('Demasiados intentos. Espera un minuto.', 429);
	for (const u of getDb().select().from(schema.usuarios).all()) {
		if (verificarPin(pin, u.pinHash)) {
			fallos.delete(origen);
			return { id: u.id, nombre: u.nombre, rol: u.rol };
		}
	}
	const n = (f && f.hasta === 0 ? f.n : 0) + 1;
	fallos.set(origen, { n, hasta: n >= 5 ? Date.now() + 60_000 : 0 });
	return null;
}

const firmar = (datos: string) => createHmac('sha256', env.sessionSecret).update(datos).digest('base64url');

export function crearToken(s: Sesion, ahora = Date.now()): string {
	const datos = Buffer.from(JSON.stringify({ ...s, exp: ahora + DURACION_MS })).toString('base64url');
	return `${datos}.${firmar(datos)}`;
}

export function leerToken(token: string | undefined, ahora = Date.now()): Sesion | null {
	const [datos, firma] = token?.split('.') ?? [];
	if (!datos || !firma) return null;
	const esperada = Buffer.from(firmar(datos));
	const recibida = Buffer.from(firma);
	if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;
	try {
		const s = JSON.parse(Buffer.from(datos, 'base64url').toString());
		if (s.exp < ahora || !ROLES.includes(s.rol)) return null;
		return { id: s.id, nombre: s.nombre, rol: s.rol };
	} catch {
		return null;
	}
}

export function ponerCookie(cookies: Cookies, url: URL, s: Sesion) {
	cookies.set(COOKIE, crearToken(s), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: url.protocol === 'https:',
		maxAge: DURACION_MS / 1000
	});
}

const TODOS: readonly Rol[] = ROLES;

/**
 * Quién puede llamar a qué. null = público. Todo lo no listado exige sesión (cualquier rol).
 * Públicos: kiosco (catálogo, crear pedido, cobro), TV (turnos, stream) y webhooks de canales/WhatsApp.
 */
export function rolesPermitidos(metodo: string, ruta: string): readonly Rol[] | null {
	const escribe = metodo !== 'GET' && metodo !== 'HEAD';
	if (ruta === '/portal/login') return null;
	if (ruta.startsWith('/portal')) return TODOS;
	if (!ruta.startsWith('/api/')) return null;
	if (/^\/api\/(login|logout|stream|turnos)$/.test(ruta)) return null;
	if (/^\/api\/(webhooks|canales|cobro|whatsapp)(\/|$)/.test(ruta)) return null;
	if (ruta === '/api/productos' && !escribe) return null;
	if (ruta === '/api/pedidos' && metodo === 'POST') return null; // kiosco; el endpoint limita el canal
	if (/^\/api\/(recetas|productos)(\/|$)/.test(ruta) && escribe) return ['admin'];
	return TODOS;
}

/** Para hooks.server.ts: devuelve una Response si hay que cortar, o undefined si pasa. */
export function proteger(event: RequestEvent): Response | undefined {
	const permitidos = rolesPermitidos(event.request.method, event.url.pathname);
	if (!permitidos) return;
	const u = event.locals.usuario;
	if (u && permitidos.includes(u.rol)) return;
	if (event.url.pathname.startsWith('/portal')) {
		const next = encodeURIComponent(event.url.pathname + event.url.search);
		return new Response(null, { status: 303, headers: { location: `/portal/login?next=${next}` } });
	}
	return Response.json(
		{ error: u ? 'No tienes permiso para esto' : 'Inicia sesión' },
		{ status: u ? 403 : 401 }
	);
}

/** Para endpoints que necesitan una regla más fina que la tabla de arriba. */
export function exigirRol(locals: App.Locals, ...roles: Rol[]) {
	if (!locals.usuario || !roles.includes(locals.usuario.rol))
		throw new ErrorNegocio('No tienes permiso para esto', 403);
}
