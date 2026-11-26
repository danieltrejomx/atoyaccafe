import { describe, expect, it } from 'vitest';
import { permitido, tiempo } from './acceso';

describe('acceso del portal', () => {
	it('cocina solo ve el monitor; caja no ve insumos; admin todo', () => {
		expect(permitido('cocina', '/portal')).toBe(true);
		expect(permitido('cocina', '/portal/caja')).toBe(false);
		expect(permitido('caja', '/portal/caja')).toBe(true);
		expect(permitido('caja', '/portal/insumos')).toBe(false);
		expect(permitido('admin', '/portal/recetas')).toBe(true);
	});
	it('tono por antigüedad', () => {
		const t = (m: number) => tiempo(0, m * 60000).tono;
		expect([t(1), t(8), t(12)]).toEqual(['', 'ambar', 'rojo']);
	});
});
