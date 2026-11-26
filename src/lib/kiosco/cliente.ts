import { ApiFallo } from '$lib/api';

async function pedir<T>(url: string, metodo: string, cuerpo?: unknown): Promise<T> {
	const r = await fetch(url, {
		method: metodo,
		headers: cuerpo ? { 'content-type': 'application/json' } : undefined,
		body: cuerpo ? JSON.stringify(cuerpo) : undefined
	});
	const data = await r.json().catch(() => ({}));
	if (!r.ok) throw new ApiFallo(r.status, data.error ?? 'Algo salió mal');
	return data as T;
}

export type EstadoCobro = 'pendiente' | 'aprobado' | 'rechazado' | 'cancelado';
export const cobro = {
	iniciar: (pedidoId: number) => pedir<{ ordenId: string; estado: EstadoCobro }>('/api/cobro', 'POST', { pedidoId }),
	estado: (ordenId: string) => pedir<{ estado: EstadoCobro }>(`/api/cobro/${encodeURIComponent(ordenId)}`, 'GET'),
	cancelar: (ordenId: string) => pedir<{ ok: true }>(`/api/cobro/${encodeURIComponent(ordenId)}`, 'DELETE')
};
export const enviarTicket = (pedidoId: number, telefono: string) =>
	pedir<{ ok: true }>('/api/whatsapp/ticket', 'POST', { pedidoId, telefono });
