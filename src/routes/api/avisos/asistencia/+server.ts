import { json } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { cuerpo, manejar } from '$lib/server/http';
import { exigirRol } from '$lib/server/auth';
import { getDb, schema } from '$lib/server/db';
import { fechaNegocio } from '$lib/server/turnos';
import type { RequestHandler } from './$types';

const checkinSchema = z.object({
	usuarioId: z.number().int().positive(),
	tipo: z.enum(['entrada', 'salida'])
});

export const POST: RequestHandler = ({ request, locals }) =>
	manejar(async () => {
		exigirRol(locals, 'admin', 'caja', 'cocina');
		const input = checkinSchema.parse(await cuerpo(request));
		const fecha = fechaNegocio();
		const db = getDb();
		const ahora = Date.now();

		const existente = db
			.select()
			.from(schema.asistencia)
			.where(and(eq(schema.asistencia.fecha, fecha), eq(schema.asistencia.usuarioId, input.usuarioId)))
			.get();

		if (existente) {
			const [actualizado] = db
				.update(schema.asistencia)
				.set(input.tipo === 'entrada' ? { entrada: ahora } : { salida: ahora })
				.where(eq(schema.asistencia.id, existente.id))
				.returning()
				.all();
			return json(actualizado);
		}

		const [nuevo] = db
			.insert(schema.asistencia)
			.values({
				fecha,
				usuarioId: input.usuarioId,
				...(input.tipo === 'entrada' ? { entrada: ahora } : { salida: ahora })
			})
			.returning()
			.all();
		return json(nuevo, { status: 201 });
	});
