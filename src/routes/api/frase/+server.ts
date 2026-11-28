import { json } from '@sveltejs/kit';
import { manejar } from '$lib/server/http';
import { emitir } from '$lib/server/sse';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request }) =>
	manejar(async () => {
		const { texto } = await request.json();
		emitir('frase.hablar', { texto: texto || '' });
		return json({ ok: true });
	});
