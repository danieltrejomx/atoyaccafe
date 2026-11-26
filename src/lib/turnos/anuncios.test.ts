import { expect, it, vi } from 'vitest';
import { crearCola } from './anuncios';

it('espacia los anuncios y conserva el orden', () => {
	vi.useFakeTimers();
	const visto: number[] = [];
	const c = crearCola<number>((n) => visto.push(n), 8000);
	c.agregar(1);
	c.agregar(2);
	c.agregar(3);
	expect(visto).toEqual([1]);
	vi.advanceTimersByTime(8000);
	expect(visto).toEqual([1, 2]);
	vi.advanceTimersByTime(8000);
	expect(visto).toEqual([1, 2, 3]);
	vi.advanceTimersByTime(8000);
	c.agregar(4);
	expect(visto).toEqual([1, 2, 3, 4]);
	vi.useRealTimers();
});
