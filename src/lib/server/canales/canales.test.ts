import '../testdb';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { fixture } from '../testdb';
import { cerrarDb, getDb, schema } from '../db';
import { eq } from 'drizzle-orm';
import { hmacHex } from './comun';
import { canales } from './index';
import { listarPedidos } from '../pedidos';
import { POST } from '../../../routes/api/canales/[canal]/webhook/+server';
import notif from './fixtures/uber-notificacion.json';
import ordenUber from './fixtures/uber-orden.json';
import rappi from './fixtures/rappi-nueva-orden.json';
import didi from './fixtures/didi-nueva-orden.json';

const S = 'secreto-de-prueba';
Object.assign(process.env, { UBER_CLIENT_ID: 'id', UBER_CLIENT_SECRET: S, RAPPI_CLIENT_ID: 'id', RAPPI_CLIENT_SECRET: S, DIDI_APP_ID: 'id', DIDI_APP_SECRET: S });

const llamadas: string[] = [];
beforeAll(async () => {
	const f = await fixture();
	const db = getDb();
	const p = schema.productos;
	db.update(p).set({ skuUber: 'sku-panini', skuRappi: 'sku-panini' }).where(eq(p.id, f.panini.id)).run();
	db.update(p).set({ skuDidi: 'sku-jugo' }).where(eq(p.id, f.jugo.id)).run();
	vi.stubGlobal('fetch', async (url: string | URL, init?: RequestInit) => {
		const u = String(url);
		llamadas.push(`${init?.method ?? 'GET'} ${u}`);
		const cuerpo = /oauth|auth0/.test(u) ? { access_token: 't', expires_in: 3600 }
			: /signin/.test(u) ? { data: { auth_token: 't' } }
			: /eats\/order\/u-100/.test(u) ? ordenUber : {};
		return new Response(JSON.stringify(cuerpo), { status: 200 });
	});
});
afterAll(() => cerrarDb());

const req = (canal: string, cuerpo: unknown, cab: (t: string) => Record<string, string>) => {
	const t = JSON.stringify(cuerpo);
	return POST({ request: new Request('http://x/api', { method: 'POST', body: t, headers: cab(t) }), params: { canal } } as never);
};
const firmas = {
	uber: (t: string) => ({ 'x-uber-signature': hmacHex(S, t) }),
	rappi: (t: string) => ({ 'rappi-signature': `t=1,sign=${hmacHex(S, '1.' + t)}` }),
	didi: (t: string) => ({ 'x-didi-signature': hmacHex(S, t) })
};

describe('firma', () => {
	for (const [c, cuerpo] of [['uber', notif], ['rappi', rappi], ['didi', didi]] as const) {
		it(`${c}: mala firma -> 401, buena -> 200`, async () => {
			expect((await req(c, cuerpo, () => ({ 'x-uber-signature': 'mala', 'rappi-signature': 't=1,sign=mala', 'x-didi-signature': 'mala' }))).status).toBe(401);
			expect((await req(c, cuerpo, firmas[c])).status).toBe(200);
		});
	}
});

describe('mapeo e idempotencia', () => {
	it('uber: SKU conocido por producto, desconocido al genérico con aviso; duplicado no crea otro', async () => {
		const antes = listarPedidos({ canal: 'uber' }).length;
		await req('uber', notif, firmas.uber);
		await req('uber', notif, firmas.uber);
		const ps = listarPedidos({ canal: 'uber' });
		expect(ps.length).toBe(antes === 0 ? 1 : antes);
		const p = ps[0];
		expect(p.externoId).toBe('uber:u-100');
		expect(p.pagoEstado).toBe('pagado');
		expect(p.items).toHaveLength(2);
		expect(p.notas).toContain('SKU desconocido');
		expect(p.items.some((i) => i.notas?.includes('sku=sku-nuevo') && i.notas.includes('$45'))).toBe(true);
		expect(llamadas.filter((l) => l.includes('accept_pos_order'))).toHaveLength(1);
	});
	it('rappi y didi mapean por SKU', async () => {
		const r = await (await req('rappi', rappi, firmas.rappi)).json();
		expect(r.creado).toBe(false); // ya creado por la prueba de firma
		expect(listarPedidos({ canal: 'rappi' })[0].total).toBe(65);
		expect(listarPedidos({ canal: 'didi' })[0].total).toBe(38 * 3);
	});
	it('evento no relevante se ignora', async () => {
		const r = await (await req('uber', { ...notif, meta: { ...notif.meta, status: 'canceled' } }, firmas.uber)).json();
		expect(r.ignorado).toBe(true);
	});
});

describe('sin credenciales', () => {
	it('verify falla y las llamadas se omiten', async () => {
		delete process.env.RAPPI_CLIENT_SECRET;
		const t = JSON.stringify(rappi);
		expect(await canales.rappi!.verify(new Request('http://x', { method: 'POST', body: t, headers: { 'rappi-signature': 't=1,sign=ab' } }))).toBe(false);
		delete process.env.RAPPI_CLIENT_ID;
		const n = llamadas.length;
		await canales.rappi!.marcarListo('rappi:r-200');
		expect(llamadas.length).toBe(n);
	});
});
