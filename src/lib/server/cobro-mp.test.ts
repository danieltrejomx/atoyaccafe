import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from './env';
import { cancelarCobro, consultarCobro, iniciarCobro } from './cobro-mp';

const respuesta = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

afterEach(() => {
	vi.unstubAllGlobals();
	vi.useRealTimers();
	env.mpToken = '';
	env.mpTerminal = '';
});

describe('con credenciales (fetch simulado)', () => {
	it('crea la orden en la terminal con monto, referencia y token de env', async () => {
		env.mpToken = 'tok-prueba';
		env.mpTerminal = 'TERM-1';
		const f = vi.fn().mockResolvedValue(respuesta({ id: 'ORD1', status: 'created', external_reference: '7' }));
		vi.stubGlobal('fetch', f);
		const c = await iniciarCobro(7, 135);
		expect(c).toEqual({ ordenId: 'ORD1', estado: 'pendiente', pedidoId: 7 });
		const [url, init] = f.mock.calls[0];
		expect(url).toBe('https://api.mercadopago.com/v1/orders');
		expect(init.headers.Authorization).toBe('Bearer tok-prueba');
		expect(JSON.parse(init.body)).toMatchObject({
			type: 'point',
			external_reference: '7',
			transactions: { payments: [{ amount: '135.00' }] },
			config: { point: { terminal_id: 'TERM-1' } }
		});
	});

	it.each([
		['processed', 'aprobado'],
		['closed', 'aprobado'],
		['canceled', 'cancelado'],
		['expired', 'cancelado'],
		['failed', 'rechazado'],
		['created', 'pendiente']
	])('estado MP %s -> %s', async (status, esperado) => {
		env.mpToken = 'x';
		env.mpTerminal = 'y';
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta({ id: 'O', status, external_reference: '3' })));
		expect((await consultarCobro('O')).estado).toBe(esperado);
	});

	it('un error de MP es 502 sin detalles técnicos para el cliente', async () => {
		env.mpToken = 'x';
		env.mpTerminal = 'y';
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta({ message: 'boom' }, 400)));
		vi.spyOn(console, 'error').mockImplementation(() => {});
		await expect(iniciarCobro(1, 10)).rejects.toMatchObject({ status: 502 });
	});

	it('cancelar llama a /cancel', async () => {
		env.mpToken = 'x';
		env.mpTerminal = 'y';
		const f = vi.fn().mockResolvedValue(respuesta({ id: 'O', status: 'canceled' }));
		vi.stubGlobal('fetch', f);
		await cancelarCobro('O');
		expect(f.mock.calls[0][0]).toBe('https://api.mercadopago.com/v1/orders/O/cancel');
	});
});

describe('sin credenciales (modo simulado)', () => {
	it('no llama a fetch y aprueba a los 4 s', async () => {
		const f = vi.fn();
		vi.stubGlobal('fetch', f);
		vi.useFakeTimers({ toFake: ['Date'] });
		const c = await iniciarCobro(9, 50);
		expect((await consultarCobro(c.ordenId)).estado).toBe('pendiente');
		vi.setSystemTime(Date.now() + 5000);
		expect(await consultarCobro(c.ordenId)).toMatchObject({ estado: 'aprobado', pedidoId: 9 });
		expect(f).not.toHaveBeenCalled();
	});

	it('cancelar marca la orden como cancelada', async () => {
		const c = await iniciarCobro(10, 50);
		await cancelarCobro(c.ordenId);
		expect((await consultarCobro(c.ordenId)).estado).toBe('cancelado');
	});
});
