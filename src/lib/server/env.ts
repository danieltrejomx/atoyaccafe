import { existsSync } from 'node:fs';

// Dev y scripts: carga .env si existe (no pisa variables ya definidas). En el VPS lo da systemd.
if (existsSync('.env')) process.loadEnvFile('.env');

const prod = process.env.NODE_ENV === 'production';

export const env = {
	prod,
	databasePath: process.env.DATABASE_PATH || './data/atoyac.db',
	migrationsDir: process.env.MIGRATIONS_DIR || './drizzle',
	tz: process.env.TZ_NEGOCIO || 'America/Mexico_City',
	/** Obligatorio en producción; en dev hay un valor fijo para no estorbar. */
	sessionSecret:
		process.env.SESSION_SECRET ||
		(prod ? '' : 'dev-secret-no-usar-en-produccion-0123456789'),
	pins: {
		admin: process.env.PIN_ADMIN || (prod ? '' : '1111'),
		caja: process.env.PIN_CAJA || (prod ? '' : '2222'),
		cocina: process.env.PIN_COCINA || (prod ? '' : '3333')
	},
	// Integraciones: solo se leen aquí, nunca se escriben en código.
	mpToken: process.env.MP_TOKEN ?? '',
	mpTerminal: process.env.MP_TERMINAL ?? '',
	waToken: process.env.WA_TOKEN ?? '',
	waPhoneId: process.env.WA_PHONE_ID ?? '',
	cuponesDueno: (process.env.CUPONES_DUENO || (prod ? '' : 'aldo,fer')).split(',').filter(Boolean)
};

/** Se llama al arrancar el servidor (no al importar: el build de SvelteKit importa los módulos). */
export function validarEnv() {
	if (prod && !env.sessionSecret) throw new Error('Falta SESSION_SECRET en producción');
}
