import { json } from '@sveltejs/kit';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { cuerpo, manejar } from '$lib/server/http';
import { exigirRol } from '$lib/server/auth';
import { getDb, schema } from '$lib/server/db';
import { fechaNegocio } from '$lib/server/turnos';
import type { RequestHandler } from './$types';

/** GET: todo lo del día (asistencia, faltantes) */
export const GET: RequestHandler = ({ locals }) =>
	manejar(() => {
		exigirRol(locals, 'admin', 'caja', 'cocina');
		const fecha = fechaNegocio();
		const db = getDb();
		const registros = db.select().from(schema.asistencia).where(eq(schema.asistencia.fecha, fecha)).all();
		const faltantesHoy = db.select().from(schema.faltantes).where(eq(schema.faltantes.fecha, fecha)).orderBy(desc(schema.faltantes.creadoEn)).all();
		const fotosHoy = db.select().from(schema.fotosLimpieza).where(eq(schema.fotosLimpieza.fecha, fecha)).all();
		const usuarios = db.select({ id: schema.usuarios.id, nombre: schema.usuarios.nombre }).from(schema.usuarios).all();
		return { registros, faltantes: faltantesHoy, fotos: fotosHoy, usuarios };
	});
