// Cliente tipado para los frontends. En `load` de SvelteKit pasa su fetch: crearApi(fetch).
import type { CrearPedidoInput, InsumoPatchInput, RecetaInput, RecetaRespuesta } from './schemas';
import type {
	Canal,
	Estado,
	Insumo,
	PagoMetodo,
	Pedido,
	Producto,
	Rol,
	TurnosRespuesta
} from './types';

export class ApiFallo extends Error {
	constructor(
		public status: number,
		mensaje: string,
		public detalle?: unknown
	) {
		super(mensaje);
	}
}

export function crearApi(f?: typeof fetch) {
	async function pedir<T>(url: string, metodo = 'GET', cuerpo?: unknown): Promise<T> {
		const r = await (f ?? fetch)(url, {
			method: metodo,
			headers: cuerpo === undefined ? undefined : { 'content-type': 'application/json' },
			body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
		});
		const data = await r.json().catch(() => ({}));
		if (!r.ok) throw new ApiFallo(r.status, data.error ?? 'Algo salió mal', data.detalle);
		return data as T;
	}
	const qs = (o: Record<string, string | undefined>) => {
		const p = new URLSearchParams(Object.entries(o).filter(([, v]) => v) as [string, string][]);
		return p.size ? `?${p}` : '';
	};

	return {
		productos: (todos = false) => pedir<Producto[]>(`/api/productos${todos ? '?todos=1' : ''}`),
		crearPedido: (p: CrearPedidoInput) => pedir<Pedido>('/api/pedidos', 'POST', p),
		pedidos: (filtro: { canal?: Canal; estado?: Estado } = {}) =>
			pedir<Pedido[]>(`/api/pedidos${qs(filtro)}`),
		pedido: (id: number) => pedir<Pedido>(`/api/pedidos/${id}`),
		cambiarEstado: (id: number, estado: Estado) =>
			pedir<Pedido>(`/api/pedidos/${id}`, 'PATCH', { estado }),
		confirmarPago: (id: number, pagoMetodo?: PagoMetodo) =>
			pedir<Pedido>(`/api/pedidos/${id}`, 'PATCH', { pagado: true, pagoMetodo }),
		turnos: () => pedir<TurnosRespuesta>('/api/turnos'),
		insumos: () => pedir<Insumo[]>('/api/insumos'),
		ajustarInsumo: (p: InsumoPatchInput) => pedir<Insumo>('/api/insumos', 'PATCH', p),
		receta: (productoId: number) => pedir<RecetaRespuesta>(`/api/recetas/${productoId}`),
		guardarReceta: (productoId: number, r: RecetaInput) =>
			pedir<RecetaRespuesta>(`/api/recetas/${productoId}`, 'PUT', r),
		login: (pin: string) => pedir<{ id: number; nombre: string; rol: Rol }>('/api/login', 'POST', { pin }),
		logout: () => pedir<{ ok: true }>('/api/logout', 'POST')
	};
}

export const api = crearApi();
