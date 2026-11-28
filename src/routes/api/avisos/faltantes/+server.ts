import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { cuerpo, manejar } from '$lib/server/http';
import { exigirRol } from '$lib/server/auth';
import { getDb, schema } from '$lib/server/db';
import { fechaNegocio } from '$lib/server/turnos';
import type { RequestHandler } from './$types';

const crearSchema = z.object({ nombre: z.string().min(1).max(200) });

export const POST: RequestHandler = ({ request, locals }) =>
	manejar(async () => {
		exigirRol(locals, 'admin', 'caja', 'cocina');
		const input = crearSchema.parse(await cuerpo(request));
		const fecha = fechaNegocio();
		const [f] = getDb()
			.insert(schema.faltantes)
			.values({ fecha, nombre: input.nombre, usuarioId: locals.usuario!.id })
			.returning()
			.all();
		return json(f, { status: 201 });
	});

export const PATCH: RequestHandler = ({ request, locals }) =>
	manejar(async () => {
		exigirRol(locals, 'admin', 'caja', 'cocina');
		const { id, resuelto } = z.object({ id: z.number().int(), resuelto: z.boolean() }).parse(await cuerpo(request));
		const [f] = getDb()
			.update(schema.faltantes)
			.set({ resuelto })
			.where(eq(schema.faltantes.id, id))
			.returning()
			.all();
		return json(f);
	});
