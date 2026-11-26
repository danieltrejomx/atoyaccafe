import { describe, expect, it } from 'vitest';
import { enlacePedido, totalLineas } from './pedido';

const lineas = [{ nombre: 'Panini de jamón', precio: 85, cantidad: 2 }, { nombre: 'Americano', precio: 35, cantidad: 1 }];

describe('pedido por WhatsApp', () => {
	it('suma el total', () => expect(totalLineas(lineas)).toBe(205));
	it('arma el mensaje con domicilio y nota', () => {
		const u = new URL(enlacePedido(lineas, { nombre: 'Ana', modo: 'domicilio', direccion: 'Calle 1', nota: 'sin cebolla' }));
		const t = u.searchParams.get('text')!;
		expect(u.pathname).toBe('/525659122497');
		expect(t).toContain('2 x Panini de jamón ($170)');
		expect(t).toContain('Total: $205');
		expect(t).toContain('Entrega en: Calle 1');
		expect(t).toContain('Nota: sin cebolla');
	});
	it('recoger no pide dirección', () => {
		const t = new URL(enlacePedido(lineas, { nombre: 'Ana', modo: 'recoger', direccion: '', nota: '' })).searchParams.get('text')!;
		expect(t).toContain('recogerlo en barra');
		expect(t).not.toContain('Nota');
	});
});
