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

export interface CajaMov {
	id: number;
	fecha: string;
	tipo: string;
	monto: number;
	concepto: string | null;
	usuarioId: number | null;
	pedidoId: number | null;
	creadoEn: number;
}

export interface AvisosResp {
	registros: { id: number; fecha: string; usuarioId: number; entrada: number | null; salida: number | null }[];
	faltantes: { id: number; fecha: string; nombre: string; resuelto: boolean; usuarioId: number | null; creadoEn: number }[];
	fotos: { id: number; fecha: string; zona: string; ruta: string; usuarioId: number | null; creadoEn: number }[];
	usuarios: { id: number; nombre: string }[];
}

export interface HorarioCelda {
	id: number;
	semana: string;
	dia: number;
	hora: number;
	empleado: string;
	actualizadoEn: number;
}

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
		logout: () => pedir<{ ok: true }>('/api/logout', 'POST'),
		// Caja
		movimientosCaja: () => pedir<CajaMov[]>('/api/caja'),
		crearMovCaja: (p: { tipo: string; monto: number; concepto?: string }) => pedir<CajaMov>('/api/caja', 'POST', p),
		// Avisos
		avisos: () => pedir<AvisosResp>('/api/avisos'),
		checkin: (usuarioId: number, tipo: 'entrada' | 'salida') => pedir('/api/avisos/asistencia', 'POST', { usuarioId, tipo }),
		crearFaltante: (nombre: string) => pedir('/api/avisos/faltantes', 'POST', { nombre }),
		resolverFaltante: (id: number, resuelto: boolean) => pedir('/api/avisos/faltantes', 'PATCH', { id, resuelto }),
		subirFoto: async (zona: string, archivo: File) => {
			const form = new FormData();
			form.append('zona', zona);
			form.append('foto', archivo);
			const r = await (f ?? fetch)('/api/avisos/fotos', { method: 'POST', body: form });
			const data = await r.json().catch(() => ({}));
			if (!r.ok) throw new ApiFallo(r.status, data.error ?? 'Error al subir foto', data.detalle);
			return data;
		},
		// Horarios
		horarios: (semana: string) => pedir<HorarioCelda[]>(`/api/horarios?semana=${semana}`),
		guardarCelda: (p: { semana: string; dia: number; hora: number; empleado: string }) => pedir('/api/horarios', 'PUT', p),
		copiarSemana: (desde: string, hasta: string) => pedir<{ copiados: number }>('/api/horarios', 'POST', { desde, hasta })
	};
}

export const api = crearApi();
