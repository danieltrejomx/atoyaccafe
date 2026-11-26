// npm run seed [-- --reset]. Catálogo = carta oficial del cliente (Amanecer, Mediodía, Tarde, Para tomar).
import { env } from '../env';
import { hashPin } from '../auth';
import { getDb, schema } from './index';
import type { Categoria, Rol } from '../../types';

const { productos, opciones, insumos, recetas, usuarios, pedidos } = schema;

type Rec = [insumo: string, cantidad: number][];
type Op = { g: string; n: string; x?: number; multi?: true; def?: true; rec?: Rec };
type Prod = { n: string; d: string; c: Categoria; p: number; f?: string; rec?: Rec; ops?: Op[] };

// nombre, unidad, stock, mínimo, frecuencia. Cantidades y stock iniciales son estimados: ajustarlos en el portal.
const INSUMOS: [string, string, number, number, string][] = [
	['Pan integral de caja', 'rebanadas', 60, 20, 'Diario'],
	['Baguette', 'piezas', 30, 10, 'Diario (pedido día anterior)'],
	['Jamón de pavo', 'kg', 2.8, 1.2, '2 veces por semana'],
	['Pechuga de pavo', 'kg', 2, 1, '2 veces por semana'],
	['Pechuga de pollo', 'kg', 3.4, 1.5, '2 veces por semana'],
	['Milanesa de pollo', 'piezas', 20, 8, '2 veces por semana'],
	['Queso panela', 'kg', 2.5, 1.2, '2 veces por semana'],
	['Queso amarillo', 'rebanadas', 80, 30, 'Semanal'],
	['Aguacate Hass', 'kg', 2.2, 1, 'Central de Abastos (2x sem)'],
	['Jitomate', 'kg', 4, 1.5, 'Central de Abastos (2x sem)'],
	['Espinaca', 'kg', 1.5, 0.6, 'Central de Abastos (2x sem)'],
	['Lechuga', 'kg', 2, 0.8, 'Central de Abastos (2x sem)'],
	['Pepino', 'kg', 2, 0.8, 'Central de Abastos (2x sem)'],
	['Limón', 'kg', 2, 0.8, 'Central de Abastos (2x sem)'],
	['Naranja para jugo', 'kg', 18, 10, 'Central de Abastos (2x sem)'],
	['Plátano', 'kg', 3, 1, 'Central de Abastos (2x sem)'],
	['Fresa', 'kg', 2, 0.8, 'Central de Abastos (2x sem)'],
	['Mezcla para crepa', 'litros', 6, 2, 'Diario'],
	['Nutella', 'kg', 2, 0.6, 'Quincenal'],
	['Queso crema', 'kg', 1.5, 0.5, 'Semanal'],
	['Miel de abeja', 'litros', 1, 0.3, 'Mensual'],
	['Cajeta', 'kg', 1.5, 0.5, 'Quincenal'],
	['Nuez', 'kg', 0.8, 0.3, 'Mensual'],
	['Concentrado de agua fresca', 'litros', 8, 3, 'Diario'],
	['Café de grano', 'kg', 3, 1, 'Quincenal'],
	['Leche', 'litros', 10, 4, '2 veces por semana'],
	['Té de hierbas', 'sobres', 60, 20, 'Mensual'],
	['Vasos, bolsas kraft y servilletas', 'paquetes', 8, 3, 'Mensual']
];

const empaque: Rec = [['Vasos, bolsas kraft y servilletas', 0.01]];
// Extras de Amanecer y Mediodía (según la carta): aguacate +$15, doble proteína +$20, pan integral sin costo.
const extrasPan = (proteina: Rec, integral = true): Op[] => [
	{ g: 'Extras', n: 'Aguacate', x: 15, multi: true, rec: [['Aguacate Hass', 0.04]] },
	{ g: 'Extras', n: 'Doble proteína', x: 20, multi: true, rec: proteina },
	...(integral ? [{ g: 'Extras', n: 'Pan integral', multi: true } as Op] : [])
];
// Extras de Tarde: plátano o fresa extra +$15, doble Nutella +$15.
const extrasCrepa: Op[] = [
	{ g: 'Extras', n: 'Plátano extra', x: 15, multi: true, rec: [['Plátano', 0.08]] },
	{ g: 'Extras', n: 'Fresa extra', x: 15, multi: true, rec: [['Fresa', 0.08]] },
	{ g: 'Extras', n: 'Doble Nutella', x: 15, multi: true, rec: [['Nutella', 0.03]] }
];
const crepa = (n: string, d: string, p: number, relleno: Rec): Prod => ({
	n, d, c: 'Tarde', p, f: '/img/dishes/crepes.jpg', rec: [['Mezcla para crepa', 0.12], ...relleno, ...empaque], ops: extrasCrepa
});
const baguette = (n: string, d: string, p: number, relleno: Rec, f: string): Prod => ({
	n, d, c: 'Mediodía', p, f, rec: [['Baguette', 1], ...relleno, ...empaque], ops: extrasPan(relleno.slice(0, 1))
});
const sabores = (): Op[] => [
	{ g: 'Sabor', n: 'Jamaica', def: true },
	{ g: 'Sabor', n: 'Horchata' },
	{ g: 'Sabor', n: 'Pepino-limón' }
];
const bebida = (n: string, d: string, c: Categoria, p: number, rec: Rec, ops: Op[] = []): Prod => ({
	n, d, c, p, f: '/img/dishes/drinks.jpg', rec: [...rec, ...empaque], ops
});

const R_CLASICO: Rec = [['Pan integral de caja', 2], ['Jamón de pavo', 0.06], ['Queso panela', 0.04]];
const R_ATOYAC: Rec = [['Pan integral de caja', 2], ['Pechuga de pavo', 0.07], ['Aguacate Hass', 0.04], ['Jitomate', 0.03], ['Espinaca', 0.015]];
// Porciones medidas en las fotos del menú (docs/fotos-whatsapp, 19-nov): toda baguette lleva 2 rebanadas de
// queso amarillo, 3 de panela (~60 g), 3 rodajas de jitomate (~45 g), 4 de pepino (~30 g) y hoja de lechuga (~25 g).
const R_BASE_BAGUETTE: Rec = [['Queso amarillo', 2], ['Queso panela', 0.06], ['Jitomate', 0.045], ['Pepino', 0.03], ['Lechuga', 0.025]];
const R_PECHUGA: Rec = [['Pechuga de pollo', 0.1], ...R_BASE_BAGUETTE];
const R_MILANESA: Rec = [['Milanesa de pollo', 1], ...R_BASE_BAGUETTE];
const R_JAMON: Rec = [['Jamón de pavo', 0.08], ...R_BASE_BAGUETTE];
const R_JUGO_NARANJA: Rec = [['Naranja para jugo', 0.9]];
const R_AGUA: Rec = [['Concentrado de agua fresca', 0.5]];
const R_AMERICANO: Rec = [['Café de grano', 0.009]];

// Carta oficial del cliente (26-nov-2026): Amanecer 7:00–11:30, Mediodía 11:30–16:30, Tarde 16:30–21:00, bebidas todo el día.
const PRODUCTOS: Prod[] = [
	{ n: 'Sándwich Clásico', d: 'Jamón de pavo y panela en pan integral', c: 'Amanecer', p: 49, f: '/img/dishes/sandwiches.jpg', rec: [...R_CLASICO, ...empaque], ops: extrasPan([['Jamón de pavo', 0.06]], false) },
	{ n: 'Sándwich Atoyac', d: 'Pechuga de pavo, aguacate, jitomate y espinaca', c: 'Amanecer', p: 65, f: '/img/dishes/sandwiches.jpg', rec: [...R_ATOYAC, ...empaque], ops: extrasPan([['Pechuga de pavo', 0.07]], false) },
	{
		n: 'Combo Amanecer', d: 'Sándwich Clásico + jugo de naranja', c: 'Amanecer', p: 79, f: '/img/dishes/sandwiches.jpg', rec: empaque,
		ops: [
			{ g: 'Sándwich', n: 'Sándwich Clásico', def: true, rec: R_CLASICO },
			{ g: 'Sándwich', n: 'Sándwich Atoyac', x: 15, rec: R_ATOYAC },
			{ g: 'Bebida', n: 'Jugo de naranja 500 ml', def: true, rec: R_JUGO_NARANJA }
		]
	},
	baguette('Baguette de pechuga', 'Pechuga a la plancha, panela, espinaca y jitomate', 89, R_PECHUGA, '/img/menu/baguette-pechuga.jpg'),
	baguette('Baguette de milanesa', 'Milanesa de pollo, panela, lechuga y jitomate', 95, R_MILANESA, '/img/menu/baguette-milanesa.jpg'),
	baguette('Baguette de jamón y queso', 'Jamón de pavo, panela, lechuga y jitomate', 85, R_JAMON, '/img/menu/baguette-jamon-queso.jpg'),
	{
		n: 'Combo Mediodía', d: 'Cualquier baguette + agua fresca 500 ml', c: 'Mediodía', p: 109, f: '/img/menu/baguette-pechuga.jpg', rec: [['Baguette', 1], ...R_AGUA, ...empaque],
		ops: [
			{ g: 'Baguette', n: 'De pechuga', def: true, rec: R_PECHUGA },
			{ g: 'Baguette', n: 'De milanesa', rec: R_MILANESA },
			{ g: 'Baguette', n: 'De jamón y queso', rec: R_JAMON },
			...sabores()
		]
	},
	crepa('Crepa Nutella', 'Con plátano fresco', 75, [['Nutella', 0.04], ['Plátano', 0.08]]),
	crepa('Crepa de fresa', 'Queso crema y miel de abeja', 72, [['Fresa', 0.08], ['Queso crema', 0.04], ['Miel de abeja', 0.015]]),
	crepa('Crepa de cajeta', 'Con nuez', 69, [['Cajeta', 0.05], ['Nuez', 0.015]]),
	{ n: 'Crepa salada', d: 'Pechuga, panela y espinaca', c: 'Tarde', p: 79, f: '/img/dishes/crepes.jpg', rec: [['Mezcla para crepa', 0.12], ['Pechuga de pollo', 0.08], ['Queso panela', 0.04], ['Espinaca', 0.015], ...empaque] },
	{
		n: 'Combo Tarde', d: 'Cualquier crepa + café americano', c: 'Tarde', p: 95, f: '/img/dishes/crepes.jpg', rec: [['Mezcla para crepa', 0.12], ...R_AMERICANO, ...empaque],
		ops: [
			{ g: 'Crepa', n: 'Nutella', def: true, rec: [['Nutella', 0.04], ['Plátano', 0.08]] },
			{ g: 'Crepa', n: 'Fresa', rec: [['Fresa', 0.08], ['Queso crema', 0.04], ['Miel de abeja', 0.015]] },
			{ g: 'Crepa', n: 'Cajeta', rec: [['Cajeta', 0.05], ['Nuez', 0.015]] },
			{ g: 'Crepa', n: 'Salada', rec: [['Pechuga de pollo', 0.08], ['Queso panela', 0.04], ['Espinaca', 0.015]] }
		]
	},
	bebida('Jugo de naranja 500 ml', 'Recién exprimido, sin azúcar', 'Jugos y aguas', 38, R_JUGO_NARANJA),
	bebida('Jugo verde 500 ml', 'Naranja, espinaca, pepino y limón', 'Jugos y aguas', 45, [['Naranja para jugo', 0.6], ['Espinaca', 0.03], ['Pepino', 0.08], ['Limón', 0.03]]),
	bebida('Agua fresca del día', 'Jamaica, horchata o pepino-limón · 1 L $40', 'Jugos y aguas', 25, R_AGUA, [
		...sabores(),
		{ g: 'Tamaño', n: '500 ml', def: true },
		{ g: 'Tamaño', n: '1 litro', x: 15, rec: R_AGUA }
	]),
	bebida('Café americano', '', 'Café y té', 25, R_AMERICANO),
	bebida('Café con leche', '', 'Café y té', 35, [...R_AMERICANO, ['Leche', 0.15]]),
	bebida('Té de hierbas', '', 'Café y té', 25, [['Té de hierbas', 1]])
];

const slug = (s: string) =>
	s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const db = getDb();
const reset = process.argv.includes('--reset');

if (reset) {
	for (const t of [pedidos, recetas, opciones, productos, insumos, usuarios]) db.delete(t).run();
}

db.transaction((tx) => {
	if (!tx.select().from(productos).limit(1).all().length) {
		const idInsumo = new Map(
			INSUMOS.map(([nombre, unidad, stock, minimo, frecuencia]) => [
				nombre,
				tx.insert(insumos).values({ nombre, unidad, stock, minimo, frecuencia }).returning().get().id
			])
		);
		const lineas = (r: Rec = []) =>
			r.map(([n, cantidad]) => {
				const insumoId = idInsumo.get(n);
				if (!insumoId) throw new Error(`Insumo desconocido: ${n}`);
				return { insumoId, cantidad };
			});
		PRODUCTOS.forEach((p, orden) => {
			const sku = `atoyac-${slug(p.n)}`;
			const { id } = tx
				.insert(productos)
				.values({ nombre: p.n, descripcion: p.d, categoria: p.c, precio: p.p, foto: p.f, orden, skuDidi: sku, skuRappi: sku, skuUber: sku })
				.returning()
				.get();
			if (p.rec) tx.insert(recetas).values(lineas(p.rec).map((l) => ({ productoId: id, ...l }))).run();
			for (const o of p.ops ?? []) {
				const op = tx
					.insert(opciones)
					.values({ productoId: id, grupo: o.g, nombre: o.n, precioExtra: o.x ?? 0, tipo: o.multi ? 'multiple' : 'unica', porDefecto: !!o.def })
					.returning()
					.get();
				if (o.rec) tx.insert(recetas).values(lineas(o.rec).map((l) => ({ opcionId: op.id, ...l }))).run();
			}
		});
		console.log(`Catálogo: ${PRODUCTOS.length} productos, ${INSUMOS.length} insumos.`);
	} else console.log('Catálogo ya existe (usa --reset para borrarlo).');

	if (!tx.select().from(usuarios).limit(1).all().length) {
		const roles: [Rol, string, string][] = [
			['admin', 'Administración', env.pins.admin],
			['caja', 'Caja', env.pins.caja],
			['cocina', 'Cocina', env.pins.cocina]
		];
		for (const [rol, nombre, pin] of roles) {
			if (!pin) throw new Error(`Falta PIN_${rol.toUpperCase()} en producción`);
			tx.insert(usuarios).values({ nombre, rol, pinHash: hashPin(pin) }).run();
		}
		console.log('Usuarios creados: admin, caja, cocina.');
	}
});
