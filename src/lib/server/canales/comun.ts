import { GENERICO_APP } from '../productos';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { CrearPedidoInput } from '../../schemas';
import { CATEGORIAS } from '../../types';
import { getDb, schema } from '../db';

type Canal = 'didi' | 'rappi' | 'uber';

/** Evento válido pero que no crea pedido (cancelación, estado, etc.): el webhook responde 200 sin hacer nada. */
export class Ignorado extends Error {}

/** Las credenciales viven solo en env; sin ellas el canal queda deshabilitado (se registra, no se llama). */
export const cred = (nombre: string) => process.env[nombre] ?? '';

export const hmacHex = (secreto: string, datos: string) =>
	createHmac('sha256', secreto).update(datos).digest('hex');

export function iguales(a: string, b: string) {
	const x = Buffer.from(a);
	const y = Buffer.from(b);
	return x.length === y.length && timingSafeEqual(x, y);
}

const REQUERIDAS = {
	uber: ['UBER_CLIENT_ID', 'UBER_CLIENT_SECRET'],
	rappi: ['RAPPI_CLIENT_ID', 'RAPPI_CLIENT_SECRET'],
	didi: ['DIDI_APP_ID', 'DIDI_APP_SECRET']
};
const habilitado = (canal: Canal) => REQUERIDAS[canal].every((n) => cred(n));

const cacheToken = new Map<string, { valor: string; vence: number }>();

/**
 * Llama a la API de la app. Devuelve null (y registra) si faltan credenciales.
 * `login` obtiene el token (se cachea hasta su vencimiento); si es undefined no se manda autorización.
 */
export async function llamar(
	canal: Canal,
	url: string,
	init: RequestInit & { json?: unknown } = {},
	login?: () => Promise<{ token: string; expiraEn: number } | null>
): Promise<unknown | null> {
	const headers = new Headers(init.headers);
	if (login) {
		let t = cacheToken.get(canal);
		// el token en caché no vale si se quitaron las credenciales
		if (t && !habilitado(canal)) t = undefined;
		if (!habilitado(canal)) return console.warn(`[canales:${canal}] sin credenciales, no se llamó ${url}`), null;
		if (!t || t.vence < Date.now()) {
			const r = await login();
			if (!r) return null;
			t = { valor: r.token, vence: Date.now() + (r.expiraEn - 60) * 1000 };
			cacheToken.set(canal, t);
		}
		headers.set('authorization', `Bearer ${t.valor}`);
	}
	if (init.json !== undefined) headers.set('content-type', 'application/json');
	const res = await fetch(url, {
		...init,
		headers,
		body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
		signal: AbortSignal.timeout(10_000)
	});
	if (!res.ok) throw new Error(`[canales:${canal}] ${init.method ?? 'GET'} ${url} -> ${res.status}`);
	return res.status === 204 ? {} : res.json().catch(() => ({}));
}

export interface LineaExterna {
	sku: string;
	nombre: string;
	/** pesos enteros */
	precio: number;
	cantidad: number;
	notas?: string;
}

const COLUMNA = { didi: 'skuDidi', rappi: 'skuRappi', uber: 'skuUber' } as const;
const GENERICO = GENERICO_APP;

/** SKU -> productos; los desconocidos van al producto genérico con nombre, precio y SKU en las notas. */
export function armarPedido(
	canal: Canal,
	idExterno: string,
	datos: { cliente?: string; telefono?: string; notas?: string },
	lineas: LineaExterna[]
): CrearPedidoInput {
	const db = getDb();
	const col = schema.productos[COLUMNA[canal]];
	let desconocidos = 0;
	const items = lineas.map((l) => {
		const p = l.sku ? db.select().from(schema.productos).where(eq(col, l.sku)).get() : undefined;
		if (p) return { productoId: p.id, cantidad: l.cantidad, opcionIds: [], notas: l.notas?.slice(0, 200) };
		desconocidos++;
		let g = db.select().from(schema.productos).where(eq(schema.productos.nombre, GENERICO)).get();
		// activo en $0 porque crearPedido rechaza inactivos; listarProductos lo oculta del catálogo público
		g ??= db
			.insert(schema.productos)
			.values({ nombre: GENERICO, categoria: CATEGORIAS[0], precio: 0, orden: 9999 })
			.returning()
			.get();
		const nota = `REVISAR sku=${l.sku || '?'} "${l.nombre}" $${l.precio}${l.notas ? ' | ' + l.notas : ''}`;
		return { productoId: g.id, cantidad: l.cantidad, opcionIds: [], notas: nota.slice(0, 200) };
	});
	const aviso = desconocidos ? `REVISAR: ${desconocidos} artículo(s) con SKU desconocido. ` : '';
	const tel = datos.telefono?.replace(/\D/g, '');
	return {
		canal,
		externoId: `${canal}:${idExterno}`,
		cliente: datos.cliente?.trim().slice(0, 60) || undefined,
		telefono: tel && /^\d{10,15}$/.test(tel) ? tel : undefined,
		notas: (aviso + (datos.notas ?? '')).trim().slice(0, 300) || undefined,
		items
	};
}

/** "uber:123" -> "123" */
export const idDe = (externoId: string) => externoId.slice(externoId.indexOf(':') + 1);
