import { eq, lte } from 'drizzle-orm';
import type { Opcion, Producto } from '../types';
import { getDb, schema } from './db';

const { productos, opciones, recetas, insumos } = schema;

/** Producto comodín para SKUs desconocidos de las apps; nunca se muestra en el catálogo público. */
export const GENERICO_APP = 'Artículo de app (revisar)';

/** Catálogo con opciones. `soloActivos` para kiosco y sitio; el portal los ve todos. */
export function listarProductos(soloActivos = true): Producto[] {
	const db = getDb();
	const filas = db
		.select()
		.from(productos)
		.where(soloActivos ? eq(productos.activo, true) : undefined)
		.orderBy(productos.orden, productos.id)
		.all();
	const ops = db.select().from(opciones).all();
	const agotados = new Set(
		db
			.select({ id: recetas.productoId })
			.from(recetas)
			.innerJoin(insumos, eq(insumos.id, recetas.insumoId))
			.where(lte(insumos.stock, 0))
			.all()
			.map((r) => r.id)
	);
	return filas
		.filter((p) => !soloActivos || p.nombre !== GENERICO_APP)
		.map((p) => ({
		id: p.id,
		nombre: p.nombre,
		descripcion: p.descripcion,
		categoria: p.categoria,
		precio: p.precio,
		foto: p.foto,
		activo: p.activo,
		disponible: !agotados.has(p.id),
		skuDidi: p.skuDidi,
		skuRappi: p.skuRappi,
		skuUber: p.skuUber,
		opciones: ops
			.filter((o) => o.productoId === p.id)
			.map((o): Opcion => ({ ...o }))
	}));
}
