import { recetaSchema } from '$lib/schemas';
import { cuerpo, ErrorNegocio, manejar } from '$lib/server/http';
import { guardarReceta, obtenerReceta } from '$lib/server/recetas';
import type { RequestHandler } from './$types';

const idDe = (v: string) => {
	const n = Number(v);
	if (!Number.isInteger(n) || n < 1) throw new ErrorNegocio('Id inválido');
	return n;
};

export const GET: RequestHandler = ({ params }) => manejar(() => obtenerReceta(idDe(params.productoId)));

export const PUT: RequestHandler = ({ params, request }) =>
	manejar(async () => guardarReceta(idDe(params.productoId), recetaSchema.parse(await cuerpo(request))));
