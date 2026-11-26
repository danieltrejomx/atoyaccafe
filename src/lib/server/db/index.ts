import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { env } from '../env';
import * as schema from './schema';

export type Db = ReturnType<typeof abrirDb>;

function abrirDb(ruta: string) {
	if (ruta !== ':memory:') mkdirSync(dirname(ruta), { recursive: true });
	const sqlite = new Database(ruta);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	sqlite.pragma('busy_timeout = 5000');
	const db = drizzle(sqlite, { schema });
	migrate(db, { migrationsFolder: env.migrationsDir }); // migraciones automáticas al arrancar
	return Object.assign(db, { sqlite });
}

let db: Db | undefined;

/** Conexión única y perezosa (el build de SvelteKit importa los módulos sin abrir la DB). */
export function getDb(): Db {
	return (db ??= abrirDb(env.databasePath));
}

/** Para pruebas: cierra la conexión actual. */
export function cerrarDb() {
	db?.sqlite.close();
	db = undefined;
}

export { schema };

export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
