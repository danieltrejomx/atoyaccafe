import { json } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { mkdirSync, writeFileSync } from 'node:fs';
import { manejar, ErrorNegocio } from '$lib/server/http';
import { exigirRol } from '$lib/server/auth';
import { getDb, schema } from '$lib/server/db';
import { fechaNegocio } from '$lib/server/turnos';
import type { RequestHandler } from './$types';

const TAREAS_VALIDAS = [
	'lavado_bano',
	'lavado_azotehuela',
	'barrida_calle',
	'trapeado_mesas',
	'salsa_chilaquiles',
	'salsa_roja',
	'lista_compras',
	'revision_bano',
	'revision_fachada',
	'revision_mesas',
	'revision_cocina',
	'revision_salsas',
	'revision_aderezos',
	'revision_aguas',
	'revision_sonido'
];

const MAX_SIZE = 5 * 1024 * 1024;

/** GET /api/checklist — items del día */
export const GET: RequestHandler = ({ locals }) =>
	manejar(() => {
		exigirRol(locals, 'admin', 'caja', 'cocina');
		const fecha = fechaNegocio();
		return getDb()
			.select()
			.from(schema.checklist)
			.where(eq(schema.checklist.fecha, fecha))
			.all();
	});

/** POST /api/checklist — marcar tarea como hecha (multipart) */
export const POST: RequestHandler = async ({ request, locals }) =>
	manejar(async () => {
		exigirRol(locals, 'admin', 'caja', 'cocina');

		const form = await request.formData();
		const tarea = form.get('tarea') as string;
		const rondaStr = form.get('ronda') as string;
		const nota = (form.get('nota') as string) || null;
		const archivo = form.get('foto') as File | null;

		if (!tarea || !TAREAS_VALIDAS.includes(tarea)) {
			throw new ErrorNegocio('Tarea inválida');
		}
		const ronda = parseInt(rondaStr, 10);
		if (isNaN(ronda) || ronda < 1 || ronda > 3) {
			throw new ErrorNegocio('Ronda inválida (1-3)');
		}

		let fotoNombre: string | null = null;
		if (archivo && archivo.size > 0) {
			if (archivo.size > MAX_SIZE) throw new ErrorNegocio('La foto no puede pesar más de 5 MB');
			const fecha = fechaNegocio();
			const ext = archivo.name.split('.').pop()?.toLowerCase() || 'jpg';
			fotoNombre = `checklist_${fecha}_${tarea}_${ronda}_${Date.now()}.${ext}`;
			const dir = './data/fotos';
			mkdirSync(dir, { recursive: true });
			writeFileSync(`${dir}/${fotoNombre}`, Buffer.from(await archivo.arrayBuffer()));
		}

		const fecha = fechaNegocio();
		const db = getDb();

		// Check if already completed
		const existente = db
			.select()
			.from(schema.checklist)
			.where(
				and(
					eq(schema.checklist.fecha, fecha),
					eq(schema.checklist.tarea, tarea),
					eq(schema.checklist.ronda, ronda)
				)
			)
			.get();

		if (existente) throw new ErrorNegocio('Esta tarea ya fue completada');

		const [row] = db
			.insert(schema.checklist)
			.values({
				fecha,
				tarea,
				ronda,
				foto: fotoNombre,
				nota,
				usuarioId: locals.usuario!.id
			})
			.returning()
			.all();

		return json(row, { status: 201 });
	});
