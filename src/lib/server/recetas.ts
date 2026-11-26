import { eq, inArray } from 'drizzle-orm';
import type { RecetaInput, RecetaRespuesta } from '../schemas';
import { getDb, schema } from './db';
import { ErrorNegocio } from './http';

const { productos, opciones, insumos, recetas } = schema;

export function obtenerReceta(productoId: number): RecetaRespuesta {
	const db = getDb();
	if (!db.select().from(productos).where(eq(productos.id, productoId)).get())
		throw new ErrorNegocio('Producto no encontrado', 404);
	const base = db
		.select({ insumoId: recetas.insumoId, cantidad: recetas.cantidad })
		.from(recetas)
		.where(eq(recetas.productoId, productoId))
		.all();
	const deOpciones = db
		.select({ opcionId: recetas.opcionId, insumoId: recetas.insumoId, cantidad: recetas.cantidad })
		.from(recetas)
		.innerJoin(opciones, eq(opciones.id, recetas.opcionId))
		.where(eq(opciones.productoId, productoId))
		.all();
	const porOpcion = new Map<number, { insumoId: number; cantidad: number }[]>();
	for (const r of deOpciones)
		porOpcion.set(r.opcionId!, [
			...(porOpcion.get(r.opcionId!) ?? []),
			{ insumoId: r.insumoId, cantidad: r.cantidad }
		]);
	return {
		productoId,
		base,
		opciones: [...porOpcion].map(([opcionId, lineas]) => ({ opcionId, lineas }))
	};
}

/** Reemplaza la receta completa del producto (base + opciones). Lo no enviado queda sin receta. */
export function guardarReceta(productoId: number, input: RecetaInput): RecetaRespuesta {
	const db = getDb();
	const propias = db
		.select({ id: opciones.id })
		.from(opciones)
		.where(eq(opciones.productoId, productoId))
		.all()
		.map((o) => o.id);
	const ajena = input.opciones.find((o) => !propias.includes(o.opcionId));
	if (ajena) throw new ErrorNegocio(`La opción ${ajena.opcionId} no es de este producto`);
	const usados = [...input.base, ...input.opciones.flatMap((o) => o.lineas)].map((l) => l.insumoId);
	const existentes = usados.length
		? db.select({ id: insumos.id }).from(insumos).where(inArray(insumos.id, usados)).all()
		: [];
	if (new Set(usados).size !== existentes.length) throw new ErrorNegocio('Hay insumos que no existen');

	obtenerReceta(productoId); // 404 si el producto no existe
	db.transaction((tx) => {
		tx.delete(recetas).where(eq(recetas.productoId, productoId)).run();
		if (propias.length) tx.delete(recetas).where(inArray(recetas.opcionId, propias)).run();
		const filas = [
			...input.base.map((l) => ({ productoId, ...l })),
			...input.opciones.flatMap((o) => o.lineas.map((l) => ({ opcionId: o.opcionId, ...l })))
		];
		if (filas.length) tx.insert(recetas).values(filas).run();
	});
	return obtenerReceta(productoId);
}
