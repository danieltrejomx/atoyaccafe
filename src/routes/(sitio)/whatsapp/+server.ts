// Bandeja de WhatsApp heredada, servida tal cual (herramienta interna, usa su propio Firebase).
import html from '$lib/sitio/whatsapp.html?raw';
import type { RequestHandler } from './$types';

export const prerender = false;
export const GET: RequestHandler = () =>
	new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex' } });
