import { json } from '@sveltejs/kit';
import { COOKIE } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ cookies }) => {
	cookies.delete(COOKIE, { path: '/' });
	return json({ ok: true });
};
