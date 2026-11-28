import type { Canal, Rol } from '$lib/types';

export const NAV: { href: string; texto: string; roles: Rol[] }[] = [
	{ href: '/portal', texto: 'Monitor', roles: ['admin', 'caja', 'cocina'] },
	{ href: '/portal/caja', texto: 'Caja', roles: ['admin', 'caja'] },
	{ href: '/portal/recetas', texto: 'Recetario', roles: ['admin', 'caja', 'cocina'] },
	{ href: '/portal/insumos', texto: 'Insumos', roles: ['admin', 'caja', 'cocina'] },
	{ href: '/portal/horarios', texto: 'Horarios', roles: ['admin', 'caja', 'cocina'] },
	{ href: '/portal/avisos', texto: 'Avisos', roles: ['admin', 'caja', 'cocina'] },
	{ href: '/portal/resumen', texto: 'Resumen', roles: ['admin'] }
];

export const permitido = (rol: Rol, ruta: string) => {
	const r = ruta.replace(/\/$/, '');
	const item = NAV.find((n) => n.href === r || (n.href !== '/portal' && r.startsWith(n.href + '/')));
	return !item || item.roles.includes(rol);
};

export const ETIQUETA_CANAL: Record<Canal, string> = {
	didi: 'DIDI', rappi: 'RAPPI', uber: 'UBER', interno: 'INTERNO', kiosco: 'KIOSCO'
};
export const TABS: Canal[] = ['interno', 'kiosco'];
export const NOMBRE_CANAL: Record<Canal, string> = {
	didi: 'DiDi', rappi: 'Rappi', uber: 'Uber', interno: 'Interno', kiosco: 'Kiosco'
};
export const SIGUIENTE: Partial<Record<string, { estado: 'preparando' | 'listo' | 'entregado'; texto: string }>> = {
	preparando: { estado: 'listo', texto: 'Marcar listo' },
	listo: { estado: 'entregado', texto: 'Entregar' }
};
export const pesos = (n: number) => `$${n.toLocaleString('es-MX')}`;

/** Minutos transcurridos y tono: ámbar a los 8 min, rojo a los 12. */
export function tiempo(creadoEn: number, ahora: number) {
	const min = Math.max(0, Math.floor((ahora - creadoEn) / 60000));
	return { min, texto: min < 1 ? 'hace menos de 1 min' : `hace ${min} min`, tono: min >= 12 ? 'rojo' : min >= 8 ? 'ambar' : '' };
}
