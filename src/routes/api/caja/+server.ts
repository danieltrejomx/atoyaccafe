import { json } from '@sveltejs/kit';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { cuerpo, ErrorNegocio, manejar } from '$lib/server/http';
import { exigirRol } from '$lib/server/auth';
import { getDb, schema } from '$lib/server/db';
import { fechaNegocio } from '$lib/server/turnos';
import type { RequestHandler } from './$types';

const crearMovSchema = z.object({
	tipo: z.enum(['fondo_inicial', 'venta_efectivo', 'retiro', 'gasto', 'ajuste']),
	monto: z.number().int(),
	concepto: z.string().max(200).optional()
});

export const GET: RequestHandler = ({ locals }) =>
	manejar(() => {
		exigirRol(locals, 'admin', 'caja');
		const fecha = fechaNegocio();
		const movs = getDb()
			.select()
			.from(schema.movimientosCaja)
			.where(eq(schema.movimientosCaja.fecha, fecha))
			.orderBy(desc(schema.movimientosCaja.creadoEn))
			.all();
		return movs;
	});

export const POST: RequestHandler = ({ request, locals }) =>
	manejar(async () => {
		exigirRol(locals, 'admin', 'caja');
		const input = crearMovSchema.parse(await cuerpo(request));
		const fecha = fechaNegocio();
		const [mov] = getDb()
			.insert(schema.movimientosCaja)
			.values({
				fecha,
				tipo: input.tipo,
				monto: input.monto,
				concepto: input.concepto ?? null,
				usuarioId: locals.usuario!.id
			})
			.returning()
			.all();
		return json(mov, { status: 201 });
	});
