import { insumoPatchSchema } from '$lib/schemas';
import { actualizarInsumo, listarInsumos } from '$lib/server/insumos';
import { cuerpo, manejar } from '$lib/server/http';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => manejar(() => listarInsumos());

/** { id, tipo: ajuste|merma|compra, cantidad, nota? } o { id, minimo } */
export const PATCH: RequestHandler = ({ request }) =>
	manejar(async () => actualizarInsumo(insumoPatchSchema.parse(await cuerpo(request))));
