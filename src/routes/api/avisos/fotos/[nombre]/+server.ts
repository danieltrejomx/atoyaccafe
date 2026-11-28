import { readFileSync, existsSync } from 'node:fs';
import { ErrorNegocio } from '$lib/server/http';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => {
	const ruta = `./data/fotos/${params.nombre}`;
	if (!existsSync(ruta)) throw new ErrorNegocio('Foto no encontrada', 404);
	const ext = params.nombre.split('.').pop()?.toLowerCase();
	const tipo = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
	return new Response(readFileSync(ruta), { headers: { 'content-type': tipo, 'cache-control': 'public, max-age=86400' } });
};
