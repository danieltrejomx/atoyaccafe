// Tipos y constantes compartidos entre servidor y frontends. Sin dependencias de servidor.

export const CANALES = ['interno', 'kiosco', 'didi', 'rappi', 'uber'] as const;
export const PAGO_METODOS = ['efectivo', 'tarjeta', 'transferencia'] as const;
export const PAGO_ESTADOS = ['pendiente', 'pagado'] as const;
export const ESTADOS = ['nuevo', 'preparando', 'listo', 'entregado', 'cancelado'] as const;
export const ROLES = ['admin', 'caja', 'cocina'] as const;
export const CATEGORIAS = ['Ensaladas', 'Chilaquiles', 'Molletes', 'Chapatas', 'Fruta', 'Postres', 'Café caliente', 'Bebidas frías', 'Promos'] as const;
export const esBebida = (categoria: string) => categoria === 'Café caliente' || categoria === 'Bebidas frías';
export const MOVIMIENTO_TIPOS = ['consumo', 'reversa', 'ajuste', 'merma', 'compra'] as const;

export type Canal = (typeof CANALES)[number];
export type PagoMetodo = (typeof PAGO_METODOS)[number];
export type PagoEstado = (typeof PAGO_ESTADOS)[number];
export type Estado = (typeof ESTADOS)[number];
export type Rol = (typeof ROLES)[number];
export type Categoria = (typeof CATEGORIAS)[number];
export type MovimientoTipo = (typeof MOVIMIENTO_TIPOS)[number];

/** Todos los montos son pesos MXN enteros. */
export interface Opcion {
	id: number;
	productoId: number;
	grupo: string;
	nombre: string;
	precioExtra: number;
	/** 'unica' = radio (una por grupo), 'multiple' = extras */
	tipo: 'unica' | 'multiple';
	porDefecto: boolean;
}

export interface Producto {
	id: number;
	nombre: string;
	descripcion: string;
	categoria: Categoria;
	precio: number;
	foto: string | null;
	activo: boolean;
	/** false si algún insumo de su receta base está en 0 o menos */
	disponible: boolean;
	skuDidi: string | null;
	skuRappi: string | null;
	skuUber: string | null;
	opciones: Opcion[];
}

export interface Insumo {
	id: number;
	nombre: string;
	unidad: string;
	stock: number;
	minimo: number;
	frecuencia: string | null;
	bajoMinimo: boolean;
}

export interface PedidoItem {
	id: number;
	productoId: number | null;
	nombre: string;
	cantidad: number;
	precioUnit: number;
	opciones: { id: number; nombre: string; precioExtra: number }[];
	notas: string | null;
}

export interface Pedido {
	id: number;
	/** Fecha del negocio, YYYY-MM-DD */
	fecha: string;
	turno: number;
	canal: Canal;
	externoId: string | null;
	cliente: string | null;
	telefono: string | null;
	pagoMetodo: PagoMetodo | null;
	pagoEstado: PagoEstado;
	estado: Estado;
	total: number;
	notas: string | null;
	creadoEn: number;
	actualizadoEn: number;
	items: PedidoItem[];
}

export interface TurnoVista {
	turno: number;
	pedidoId: number;
	estado: Estado;
	productos: string[];
}

export interface TurnosRespuesta {
	/** El turno que se está atendiendo (preparando; si no hay, el más antiguo en nuevo) */
	actual: TurnoVista | null;
	/** Hasta 3 números de turno en espera */
	proximos: number[];
	/** Turnos listos para recoger, del más reciente al más antiguo (hasta 5) */
	listos: number[];
}

/** Eventos SSE de /api/stream */
export interface EventosSSE {
	'pedido.creado': Pedido;
	'pedido.actualizado': Pedido;
	'turno.listo': { turno: number; pedidoId: number };
	'insumo.actualizado': Insumo;
}
export type NombreEvento = keyof EventosSSE;

export interface ApiError {
	error: string;
	detalle?: unknown;
}
