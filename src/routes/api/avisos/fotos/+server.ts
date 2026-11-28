import { json } from '@sveltejs/kit';
import { mkdirSync, writeFileSync } from 'node:fs';
import { z } from 'zod';
import { manejar, ErrorNegocio } from '$lib/server/http';
import { exigirRol } from '$lib/server/auth';
import { getDb, schema } from '$lib/server/db';
import { fechaNegocio } from '$lib/server/turnos';
import type { RequestHandler } from './$types';

const ZONAS = ['cocina', 'bano', 'mesas', 'general'] as const;
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export const POST: RequestHandler = async ({ request, locals }) => {
	exigirRol(locals, 'admin', 'caja', 'cocina');
	const form = await request.formData();
	const zona = form.get('zona') as string;
	const archivo = form.get('foto') as File | null;

	if (!zona || !ZONAS.includes(zona as typeof ZONAS[number])) {
		throw new ErrorNegocio('Zona inválida (cocina, bano, mesas, general)');
	}
	if (!archivo || archivo.size === 0) throw new ErrorNegocio('Falta la foto');
	if (archivo.size > MAX_SIZE) throw new ErrorNegocio('La foto no puede pesar más de 5 MB');

	const fecha = fechaNegocio();
	const ext = archivo.name.split('.').pop()?.toLowerCase() || 'jpg';
	const nombre = `${fecha}_${zona}_${Date.now()}.${ext}`;
	const dir = `./data/fotos`;
	mkdirSync(dir, { recursive: true });
	writeFileSync(`${dir}/${nombre}`, Buffer.from(await archivo.arrayBuffer()));

	const [f] = getDb()
		.insert(schema.fotosLimpieza)
		.values({ fecha, zona: zona as typeof ZONAS[number], ruta: nombre, usuarioId: locals.usuario!.id })
		.returning()
		.all();

	return json(f, { status: 201 });
};
