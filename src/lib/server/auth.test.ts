import './testdb';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cerrarDb, getDb, schema } from './db';
import { crearToken, hashPin, leerToken, login, rolesPermitidos, verificarPin } from './auth';

beforeAll(() => {
	const db = getDb();
	db.insert(schema.usuarios).values({ nombre: 'Caja', rol: 'caja', pinHash: hashPin('2222') }).run();
});
afterAll(() => cerrarDb());

describe('PIN', () => {
	it('hash con sal: mismo PIN, distinto hash, ambos verifican', () => {
		const [a, b] = [hashPin('1234'), hashPin('1234')];
		expect(a).not.toBe(b);
		expect(verificarPin('1234', a) && verificarPin('1234', b)).toBe(true);
		expect(verificarPin('4321', a)).toBe(false);
	});

	it('login correcto devuelve el rol; PIN malo devuelve null', () => {
		expect(login('2222', 'a')?.rol).toBe('caja');
		expect(login('9999', 'b')).toBeNull();
	});

	it('bloquea el origen tras 5 fallos', () => {
		for (let i = 0; i < 5; i++) login('0000', 'atacante');
		expect(() => login('2222', 'atacante')).toThrow(/intentos/);
		expect(login('2222', 'otro')?.rol).toBe('caja');
	});
});

describe('sesión firmada', () => {
	const s = { id: 1, nombre: 'Caja', rol: 'caja' as const };
	it('ida y vuelta, y rechaza manipulación y expiración', () => {
		const t = crearToken(s);
		expect(leerToken(t)).toEqual(s);
		const [datos, firma] = t.split('.');
		const falso = Buffer.from(JSON.stringify({ ...s, rol: 'admin', exp: Date.now() + 1e6 })).toString('base64url');
		expect(leerToken(`${falso}.${firma}`)).toBeNull();
		expect(leerToken(`${datos}.x${firma}`)).toBeNull();
		expect(leerToken(t, Date.now() + 13 * 3600 * 1000)).toBeNull();
		expect(leerToken(undefined)).toBeNull();
	});
});

describe('permisos por ruta', () => {
	it('kiosco y TV públicos; portal y mutaciones protegidas', () => {
		expect(rolesPermitidos('GET', '/api/productos')).toBeNull();
		expect(rolesPermitidos('GET', '/api/turnos')).toBeNull();
		expect(rolesPermitidos('GET', '/api/stream')).toBeNull();
		expect(rolesPermitidos('POST', '/api/pedidos')).toBeNull();
		expect(rolesPermitidos('POST', '/api/webhooks/uber')).toBeNull();
		expect(rolesPermitidos('GET', '/api/pedidos')).not.toBeNull();
		expect(rolesPermitidos('PATCH', '/api/pedidos/3')).not.toBeNull();
		expect(rolesPermitidos('PUT', '/api/recetas/3')).toEqual(['admin']);
		expect(rolesPermitidos('GET', '/portal')).not.toBeNull();
		expect(rolesPermitidos('GET', '/portal/login')).toBeNull();
	});
});
