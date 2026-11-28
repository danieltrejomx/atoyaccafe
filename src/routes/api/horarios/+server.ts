import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { cuerpo, manejar } from '$lib/server/http';
import { exigirRol } from '$lib/server/auth';
import { getDb, schema } from '$lib/server/db';
import type { RequestHandler } from './$types';

/** GET /api/horarios?semana=2026-W48 */
export const GET: RequestHandler = ({ url, locals }) =>
	manejar(() => {
		exigirRol(locals, 'admin', 'caja', 'cocina');
		const semana = url.searchParams.get('semana');
		if (!semana) return [];
		return getDb()
			.select()
			.from(schema.horarios)
			.where(eq(schema.horarios.semana, semana))
			.all();
	});

const celdaSchema = z.object({
	semana: z.string().regex(/^\d{4}-W\d{2}$/),
	dia: z.number().int().min(0).max(5),
	hora: z.number().int().min(8).max(18),
	empleado: z.string().max(60)
});

/** PUT /api/horarios — upsert de una celda */
export const PUT: RequestHandler = ({ request, locals }) =>
	manejar(async () => {
		exigirRol(locals, 'admin', 'caja');
		const input = celdaSchema.parse(await cuerpo(request));
		const db = getDb();
		const ahora = Date.now();

		// SQLite upsert
		db.sqlite
			.prepare(
				`INSERT INTO horarios (semana, dia, hora, empleado, actualizado_en)
				 VALUES (?, ?, ?, ?, ?)
				 ON CONFLICT(semana, dia, hora) DO UPDATE SET empleado = excluded.empleado, actualizado_en = excluded.actualizado_en`
			)
			.run(input.semana, input.dia, input.hora, input.empleado, ahora);

		return json({ ok: true });
	});

/** POST /api/horarios/copiar — copia la semana anterior a la actual */
export const POST: RequestHandler = ({ request, locals }) =>
	manejar(async () => {
		exigirRol(locals, 'admin', 'caja');
		const { desde, hasta } = z
			.object({ desde: z.string(), hasta: z.string() })
			.parse(await cuerpo(request));

		const db = getDb();
		const origen = db
			.select()
			.from(schema.horarios)
			.where(eq(schema.horarios.semana, desde))
			.all();

		if (origen.length === 0) return json({ copiados: 0 });

		const ahora = Date.now();
		for (const h of origen) {
			db.sqlite
				.prepare(
					`INSERT INTO horarios (semana, dia, hora, empleado, actualizado_en)
					 VALUES (?, ?, ?, ?, ?)
					 ON CONFLICT(semana, dia, hora) DO UPDATE SET empleado = excluded.empleado, actualizado_en = excluded.actualizado_en`
				)
				.run(hasta, h.dia, h.hora, h.empleado, ahora);
		}

		return json({ copiados: origen.length });
	});
