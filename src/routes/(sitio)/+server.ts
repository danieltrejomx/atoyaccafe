// Home del sitio anterior, a petición del cliente (26-nov-2026): se sirve tal cual con rutas ajustadas.
import html from '$lib/sitio/home-legacy.html?raw';

export const GET = () => new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
