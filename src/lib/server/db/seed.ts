// npm run seed [-- --reset]. Catálogo = carta oficial del cliente (Amanecer, Mediodía, Tarde, Para tomar).
import { env } from '../env';
import { hashPin } from '../auth';
import { getDb, schema } from './index';
import type { Categoria, Rol } from '../../types';

const { productos, opciones, insumos, recetas, usuarios, pedidos } = schema;

type Rec = [insumo: string, cantidad: number][];
type Op = { g: string; n: string; x?: number; multi?: true; def?: true; rec?: Rec };
type Prod = { n: string; d: string; c: Categoria; p: number; f?: string; rec?: Rec; ops?: Op[] };

// Unidades de cocina: todo se cuenta, nada se pesa (rebanadas, rodajas, piezas, cucharadas).
// El inventario se cuenta en esas mismas unidades. Stock y mínimos iniciales son estimados.
// nombre, unidad, stock, mínimo, frecuencia
const INSUMOS: [string, string, number, number, string][] = [
	['Pan integral de caja', 'rebanadas', 60, 20, 'Diario'],
	['Baguette', 'piezas', 30, 10, 'Diario (pedido día anterior)'],
	['Jamón de pavo', 'rebanadas', 120, 40, '2 veces por semana'],
	['Pechuga de pavo', 'rebanadas', 80, 30, '2 veces por semana'],
	['Pechuga de pollo', 'filetes', 25, 10, '2 veces por semana'],
	['Milanesa de pollo', 'piezas', 20, 8, '2 veces por semana'],
	['Queso panela', 'rebanadas', 100, 40, '2 veces por semana'],
	['Queso amarillo', 'rebanadas', 80, 30, 'Semanal'],
	['Aguacate Hass', 'piezas', 15, 6, 'Central de Abastos (2x sem)'],
	['Jitomate', 'rodajas', 120, 40, 'Central de Abastos (2x sem)'],
	['Pepino', 'rodajas', 120, 40, 'Central de Abastos (2x sem)'],
	['Lechuga', 'hojas', 60, 20, 'Central de Abastos (2x sem)'],
	['Espinaca', 'puños', 30, 10, 'Central de Abastos (2x sem)'],
	['Limón', 'piezas', 30, 10, 'Central de Abastos (2x sem)'],
	['Naranja para jugo', 'piezas', 80, 30, 'Central de Abastos (2x sem)'],
	['Plátano', 'piezas', 15, 5, 'Central de Abastos (2x sem)'],
	['Fresa', 'piezas', 60, 20, 'Central de Abastos (2x sem)'],
	['Mezcla para crepa', 'crepas', 40, 15, 'Diario'],
	['Nutella', 'cucharadas', 80, 25, 'Quincenal'],
	['Queso crema', 'cucharadas', 50, 15, 'Semanal'],
	['Miel de abeja', 'cucharadas', 50, 15, 'Mensual'],
	['Cajeta', 'cucharadas', 50, 15, 'Quincenal'],
	['Nuez', 'cucharadas', 30, 10, 'Mensual'],
	['Agua fresca preparada', 'vasos de 500 ml', 30, 10, 'Diario'],
	['Café de grano', 'cucharadas', 150, 50, 'Quincenal'],
	['Leche', 'tazas', 30, 10, '2 veces por semana'],
	['Té de hierbas', 'sobres', 60, 20, 'Mensual'],
	['Empaque para llevar', 'kits', 200, 60, 'Mensual']
];

const empaque: Rec = [['Empaque para llevar', 1]];
// Extras de Amanecer y Mediodía (según la carta): aguacate +$15 = medio aguacate, doble proteína +$20, pan integral sin costo.
const extrasPan = (proteina: Rec, integral = true): Op[] => [
	{ g: 'Extras', n: 'Aguacate', x: 15, multi: true, rec: [['Aguacate Hass', 0.5]] },
	{ g: 'Extras', n: 'Doble proteína', x: 20, multi: true, rec: proteina },
	...(integral ? [{ g: 'Extras', n: 'Pan integral', multi: true } as Op] : [])
];
// Extras de Tarde: plátano o fresa extra +$15, doble Nutella +$15.
const extrasCrepa: Op[] = [
	{ g: 'Extras', n: 'Plátano extra', x: 15, multi: true, rec: [['Plátano', 0.5]] },
	{ g: 'Extras', n: 'Fresa extra', x: 15, multi: true, rec: [['Fresa', 4]] },
	{ g: 'Extras', n: 'Doble Nutella', x: 15, multi: true, rec: [['Nutella', 2]] }
];
const crepa = (n: string, d: string, p: number, relleno: Rec): Prod => ({
	n, d, c: 'Tarde', p, f: '/img/dishes/crepes.jpg', rec: [['Mezcla para crepa', 1], ...relleno, ...empaque], ops: extrasCrepa
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

const R_CLASICO: Rec = [['Pan integral de caja', 2], ['Jamón de pavo', 2], ['Queso panela', 2]];
const R_ATOYAC: Rec = [['Pan integral de caja', 2], ['Pechuga de pavo', 3], ['Aguacate Hass', 0.5], ['Jitomate', 2], ['Espinaca', 1]];
// Porciones contadas en las fotos del menú (docs/fotos-whatsapp, 19-nov): toda baguette lleva 2 rebanadas de
// queso amarillo, 3 de panela, 3 rodajas de jitomate, 4 de pepino y 2 hojas de lechuga.
const R_BASE_BAGUETTE: Rec = [['Queso amarillo', 2], ['Queso panela', 3], ['Jitomate', 3], ['Pepino', 4], ['Lechuga', 2]];
const R_PECHUGA: Rec = [['Pechuga de pollo', 1], ...R_BASE_BAGUETTE];
const R_MILANESA: Rec = [['Milanesa de pollo', 1], ...R_BASE_BAGUETTE];
const R_JAMON: Rec = [['Jamón de pavo', 4], ...R_BASE_BAGUETTE];
const R_NUTELLA: Rec = [['Nutella', 2], ['Plátano', 0.5]];
const R_FRESA: Rec = [['Fresa', 5], ['Queso crema', 2], ['Miel de abeja', 1]];
const R_CAJETA: Rec = [['Cajeta', 2], ['Nuez', 1]];
const R_SALADA: Rec = [['Pechuga de pollo', 1], ['Queso panela', 2], ['Espinaca', 1]];
const R_JUGO_NARANJA: Rec = [['Naranja para jugo', 5]];
const R_AGUA: Rec = [['Agua fresca preparada', 1]];
const R_AMERICANO: Rec = [['Café de grano', 2]];

// Carta oficial del cliente (26-nov-2026): Amanecer 7:00–11:30, Mediodía 11:30–16:30, Tarde 16:30–21:00, bebidas todo el día.
const PRODUCTOS: Prod[] = [
	{ n: 'Sándwich Clásico', d: 'Jamón de pavo y panela en pan integral', c: 'Amanecer', p: 49, f: '/img/dishes/sandwiches.jpg', rec: [...R_CLASICO, ...empaque], ops: extrasPan([['Jamón de pavo', 2]], false) },
	{ n: 'Sándwich Atoyac', d: 'Pechuga de pavo, aguacate, jitomate y espinaca', c: 'Amanecer', p: 65, f: '/img/dishes/sandwiches.jpg', rec: [...R_ATOYAC, ...empaque], ops: extrasPan([['Pechuga de pavo', 3]], false) },
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
	crepa('Crepa Nutella', 'Con plátano fresco', 75, R_NUTELLA),
	crepa('Crepa de fresa', 'Queso crema y miel de abeja', 72, R_FRESA),
	crepa('Crepa de cajeta', 'Con nuez', 69, R_CAJETA),
	{ n: 'Crepa salada', d: 'Pechuga, panela y espinaca', c: 'Tarde', p: 79, f: '/img/dishes/crepes.jpg', rec: [['Mezcla para crepa', 1], ...R_SALADA, ...empaque] },
	{
		n: 'Combo Tarde', d: 'Cualquier crepa + café americano', c: 'Tarde', p: 95, f: '/img/dishes/crepes.jpg', rec: [['Mezcla para crepa', 1], ...R_AMERICANO, ...empaque],
		ops: [
			{ g: 'Crepa', n: 'Nutella', def: true, rec: R_NUTELLA },
			{ g: 'Crepa', n: 'Fresa', rec: R_FRESA },
			{ g: 'Crepa', n: 'Cajeta', rec: R_CAJETA },
			{ g: 'Crepa', n: 'Salada', rec: R_SALADA }
		]
	},
	bebida('Jugo de naranja 500 ml', 'Recién exprimido, sin azúcar', 'Jugos y aguas', 38, R_JUGO_NARANJA),
	bebida('Jugo verde 500 ml', 'Naranja, espinaca, pepino y limón', 'Jugos y aguas', 45, [['Naranja para jugo', 3], ['Espinaca', 1], ['Pepino', 6], ['Limón', 1]]),
	bebida('Agua fresca del día', 'Jamaica, horchata o pepino-limón · 1 L $40', 'Jugos y aguas', 25, R_AGUA, [
		...sabores(),
		{ g: 'Tamaño', n: '500 ml', def: true },
		{ g: 'Tamaño', n: '1 litro', x: 15, rec: R_AGUA }
	]),
	bebida('Café americano', '', 'Café y té', 25, R_AMERICANO),
	bebida('Café con leche', '', 'Café y té', 35, [...R_AMERICANO, ['Leche', 1]]),
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
