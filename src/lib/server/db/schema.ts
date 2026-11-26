import { sql } from 'drizzle-orm';
import {
	check,
	index,
	integer,
	real,
	sqliteTable,
	text,
	uniqueIndex
} from 'drizzle-orm/sqlite-core';
import {
	CANALES,
	CATEGORIAS,
	ESTADOS,
	MOVIMIENTO_TIPOS,
	PAGO_ESTADOS,
	PAGO_METODOS,
	ROLES
} from '../../types';

const ahora = () => Date.now();

export const productos = sqliteTable('productos', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	nombre: text('nombre').notNull(),
	descripcion: text('descripcion').notNull().default(''),
	categoria: text('categoria', { enum: CATEGORIAS }).notNull(),
	precio: integer('precio').notNull(),
	foto: text('foto'),
	activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
	orden: integer('orden').notNull().default(0),
	skuDidi: text('sku_didi'),
	skuRappi: text('sku_rappi'),
	skuUber: text('sku_uber')
});

export const opciones = sqliteTable(
	'opciones',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		productoId: integer('producto_id')
			.notNull()
			.references(() => productos.id, { onDelete: 'cascade' }),
		grupo: text('grupo').notNull(),
		nombre: text('nombre').notNull(),
		precioExtra: integer('precio_extra').notNull().default(0),
		tipo: text('tipo', { enum: ['unica', 'multiple'] }).notNull().default('unica'),
		porDefecto: integer('por_defecto', { mode: 'boolean' }).notNull().default(false)
	},
	(t) => [index('opciones_producto').on(t.productoId)]
);

export const insumos = sqliteTable('insumos', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	nombre: text('nombre').notNull().unique(),
	unidad: text('unidad').notNull(),
	stock: real('stock').notNull().default(0),
	minimo: real('minimo').notNull().default(0),
	frecuencia: text('frecuencia')
});

/** Una fila = un insumo que consume un producto O una opción (exactamente uno de los dos). */
export const recetas = sqliteTable(
	'recetas',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		productoId: integer('producto_id').references(() => productos.id, { onDelete: 'cascade' }),
		opcionId: integer('opcion_id').references(() => opciones.id, { onDelete: 'cascade' }),
		insumoId: integer('insumo_id')
			.notNull()
			.references(() => insumos.id, { onDelete: 'cascade' }),
		cantidad: real('cantidad').notNull()
	},
	(t) => [
		check('recetas_un_dueno', sql`(${t.productoId} IS NULL) <> (${t.opcionId} IS NULL)`),
		index('recetas_producto').on(t.productoId),
		index('recetas_opcion').on(t.opcionId)
	]
);

export const pedidos = sqliteTable(
	'pedidos',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		fecha: text('fecha').notNull(),
		turno: integer('turno').notNull(),
		canal: text('canal', { enum: CANALES }).notNull(),
		externoId: text('externo_id').unique(),
		cliente: text('cliente'),
		telefono: text('telefono'),
		pagoMetodo: text('pago_metodo', { enum: PAGO_METODOS }),
		pagoEstado: text('pago_estado', { enum: PAGO_ESTADOS }).notNull().default('pendiente'),
		estado: text('estado', { enum: ESTADOS }).notNull().default('nuevo'),
		total: integer('total').notNull(),
		notas: text('notas'),
		creadoEn: integer('creado_en').notNull().$defaultFn(ahora),
		actualizadoEn: integer('actualizado_en').notNull().$defaultFn(ahora)
	},
	(t) => [
		uniqueIndex('pedidos_fecha_turno').on(t.fecha, t.turno),
		index('pedidos_canal_estado').on(t.canal, t.estado)
	]
);

export const pedidoItems = sqliteTable(
	'pedido_items',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		pedidoId: integer('pedido_id')
			.notNull()
			.references(() => pedidos.id, { onDelete: 'cascade' }),
		productoId: integer('producto_id').references(() => productos.id, { onDelete: 'set null' }),
		nombre: text('nombre').notNull(),
		cantidad: integer('cantidad').notNull(),
		precioUnit: integer('precio_unit').notNull(),
		opciones: text('opciones', { mode: 'json' })
			.$type<{ id: number; nombre: string; precioExtra: number }[]>()
			.notNull()
			.default(sql`'[]'`),
		notas: text('notas')
	},
	(t) => [index('items_pedido').on(t.pedidoId)]
);

/** Bitácora. `cantidad` lleva signo: consumo negativo, reversa/compra positivo, ajuste/merma según el caso. */
export const movimientosInsumo = sqliteTable(
	'movimientos_insumo',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		insumoId: integer('insumo_id')
			.notNull()
			.references(() => insumos.id, { onDelete: 'cascade' }),
		tipo: text('tipo', { enum: MOVIMIENTO_TIPOS }).notNull(),
		cantidad: real('cantidad').notNull(),
		pedidoId: integer('pedido_id').references(() => pedidos.id, { onDelete: 'set null' }),
		nota: text('nota'),
		creadoEn: integer('creado_en').notNull().$defaultFn(ahora)
	},
	(t) => [index('mov_insumo').on(t.insumoId), index('mov_pedido').on(t.pedidoId)]
);

export const usuarios = sqliteTable('usuarios', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	nombre: text('nombre').notNull(),
	rol: text('rol', { enum: ROLES }).notNull(),
	/** scrypt: "salt_hex:hash_hex" */
	pinHash: text('pin_hash').notNull()
});
