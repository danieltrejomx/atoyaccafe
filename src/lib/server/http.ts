import { json } from '@sveltejs/kit';
import { ZodError } from 'zod';

export class ErrorNegocio extends Error {
	constructor(
		mensaje: string,
		public status = 400
	) {
		super(mensaje);
	}
}

/** Envuelve un handler: ZodError -> 400, ErrorNegocio -> su status, el resto se propaga como 500. */
export async function manejar(fn: () => unknown | Promise<unknown>): Promise<Response> {
	try {
		const r = await fn();
		return r instanceof Response ? r : json(r);
	} catch (e) {
		if (e instanceof ZodError)
			return json({ error: 'Datos inválidos', detalle: e.issues }, { status: 400 });
		if (e instanceof ErrorNegocio) return json({ error: e.message }, { status: e.status });
		throw e;
	}
}

/** Lee el cuerpo JSON; un cuerpo vacío o roto es 400, no 500. */
export async function cuerpo(request: Request): Promise<unknown> {
	try {
		return await request.json();
	} catch {
		throw new ErrorNegocio('El cuerpo debe ser JSON válido');
	}
}
