// Solo para pruebas: DB temporal por archivo de prueba. Importar ANTES que cualquier módulo de servidor.
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.DATABASE_PATH = join(mkdtempSync(join(tmpdir(), 'atoyac-test-')), 'test.db');
process.env.NODE_ENV = 'test';

/** Catálogo mínimo: Panini (pan 1 + queso 0.05), opción Croissant (+$10, 1 croissant), Jugo sin receta. */
export async function fixture() {
	const { getDb, schema } = await import('./db');
	const db = getDb();
	const ins = (nombre: string, stock: number) =>
		db.insert(schema.insumos).values({ nombre, unidad: 'pz', stock, minimo: 2 }).returning().get();
	const pan = ins('Pan', 10);
	const queso = ins('Queso', 5);
	const croissant = ins('Croissant', 3);
	const panini = db
		.insert(schema.productos)
		.values({ nombre: 'Panini Jamón', categoria: 'Mediodía', precio: 65 })
		.returning()
		.get();
	const jugo = db
		.insert(schema.productos)
		.values({ nombre: 'Jugo', categoria: 'Jugos y aguas', precio: 38 })
		.returning()
		.get();
	const opCroissant = db
		.insert(schema.opciones)
		.values({ productoId: panini.id, grupo: 'Pan', nombre: 'Croissant', precioExtra: 10 })
		.returning()
		.get();
	const opArtesanal = db
		.insert(schema.opciones)
		.values({ productoId: panini.id, grupo: 'Pan', nombre: 'Artesanal' })
		.returning()
		.get();
	db.insert(schema.recetas)
		.values([
			{ productoId: panini.id, insumoId: pan.id, cantidad: 1 },
			{ productoId: panini.id, insumoId: queso.id, cantidad: 0.05 },
			{ opcionId: opCroissant.id, insumoId: croissant.id, cantidad: 1 }
		])
		.run();
	return { pan, queso, croissant, panini, jugo, opCroissant, opArtesanal };
}

export async function stock(id: number) {
	const { obtenerInsumo } = await import('./insumos');
	return obtenerInsumo(id)!.stock;
}
