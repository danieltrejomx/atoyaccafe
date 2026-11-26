// npm run seed [-- --reset]. Datos iniciales tomados de legacy/js/store.js y legacy/kiosco.html,
// reordenados en las categorías de la parrilla de contenido. Los precios de ensaladas y bebidas
// calientes son propuestos: confirmarlos con el cliente.
import { env } from '../env';
import { hashPin } from '../auth';
import { getDb, schema } from './index';
import type { Categoria, Rol } from '../../types';

const { productos, opciones, insumos, recetas, usuarios, pedidos } = schema;

type Rec = [insumo: string, cantidad: number][];
type Op = { g: string; n: string; x?: number; multi?: true; def?: true; rec?: Rec };
type Prod = { n: string; d: string; c: Categoria; p: number; f?: string; rec?: Rec; ops?: Op[] };

// nombre, unidad, stock, mínimo, frecuencia (del INITIAL_INVENTORY y de las recetas nuevas)
const INSUMOS: [string, string, number, number, string][] = [
	['Pan para panini', 'piezas', 40, 15, 'Diario (pedido día anterior)'],
	['Croissant', 'piezas', 12, 6, 'Diario (pedido día anterior)'],
	['Pan para mollete', 'piezas', 30, 12, 'Diario (pedido día anterior)'],
	['Totopos', 'kg', 4, 1.5, '2 veces por semana'],
	['Lechuga y mezcla de hojas', 'kg', 3, 1.2, 'Central de Abastos (2x sem)'],
	['Jitomate', 'kg', 4, 1.5, 'Central de Abastos (2x sem)'],
	['Espinaca', 'kg', 1.5, 0.6, 'Central de Abastos (2x sem)'],
	['Pepino', 'kg', 2, 0.8, 'Central de Abastos (2x sem)'],
	['Aguacate Hass', 'kg', 2.2, 1, 'Central de Abastos (2x sem)'],
	['Naranja para jugo', 'kg', 18, 10, 'Central de Abastos (2x sem)'],
	['Pechuga de pollo', 'kg', 3.4, 1.5, '2 veces por semana'],
	['Res a la plancha', 'kg', 2.5, 1.2, '2 veces por semana'],
	['Atún', 'kg', 1.5, 0.6, 'Mensual'],
	['Jamón de pavo', 'kg', 2.8, 1.5, '2 veces por semana'],
	['Queso panela fresco', 'kg', 2.5, 1.2, '2 veces por semana'],
	['Queso gratinado', 'kg', 2, 0.8, '2 veces por semana'],
	['Frijoles refritos', 'kg', 3, 1, '2 veces por semana'],
	['Crema', 'kg', 1.5, 0.5, '2 veces por semana'],
	['Salsa verde', 'litros', 3, 1, 'Diario'],
	['Salsa roja', 'litros', 3, 1, 'Diario'],
	['Huevo', 'piezas', 60, 24, '2 veces por semana'],
	['Café de grano', 'kg', 3, 1, 'Quincenal'],
	['Leche', 'litros', 10, 4, '2 veces por semana'],
	['Té de hierbas', 'sobres', 60, 20, 'Mensual'],
	['Concentrado de agua fresca', 'litros', 8, 3, 'Diario'],
	['Vasos, bolsas kraft y servilletas', 'paquetes', 8, 3, 'Mensual']
];

const hielo = (): Op[] => [
	{ g: 'Hielo', n: 'Normal', def: true },
	{ g: 'Hielo', n: 'Poco hielo' },
	{ g: 'Hielo', n: 'Sin hielo' }
];
const dobleShot: Op = { g: 'Extras', n: 'Doble shot', x: 12, multi: true, rec: [['Café de grano', 0.009]] };
const ensalada = (n: string, d: string, p: number, proteina: Rec): Prod => ({
	n: `Ensalada ${n}`,
	d,
	c: 'Ensaladas',
	p,
	rec: [['Lechuga y mezcla de hojas', 0.12], ['Jitomate', 0.05], ['Aguacate Hass', 0.04], ...proteina, ['Vasos, bolsas kraft y servilletas', 0.01]],
	ops: [{ g: 'Extras', n: 'Aguacate extra', x: 15, multi: true, rec: [['Aguacate Hass', 0.04]] }]
});
const panini = (n: string, d: string, p: number, relleno: Rec): Prod => ({
	n: `Panini ${n}`,
	d,
	c: 'Paninis',
	p,
	f: '/img/dishes/sandwiches.jpg',
	rec: [['Pan para panini', 1], ['Queso panela fresco', 0.04], ...relleno],
	ops: [
		{ g: 'Pan', n: 'Pan artesanal', def: true },
		{ g: 'Pan', n: 'Croissant', x: 10, rec: [['Croissant', 1]] },
		{ g: 'Extras', n: 'Aguacate', x: 15, multi: true, rec: [['Aguacate Hass', 0.04]] },
		{ g: 'Extras', n: 'Doble proteína', x: 20, multi: true, rec: relleno },
		{ g: 'Extras', n: 'Queso panela extra', x: 12, multi: true, rec: [['Queso panela fresco', 0.04]] }
	]
});
const bebida = (n: string, d: string, c: Categoria, p: number, rec: Rec, ops: Op[] = []): Prod => ({
	n,
	d,
	c,
	p,
	f: '/img/dishes/drinks.jpg',
	rec,
	ops
});

const PRODUCTOS: Prod[] = [
	ensalada('Tradicional', 'Mezcla de hojas, jitomate, aguacate y aderezo de la casa.', 85, [['Queso panela fresco', 0.04]]),
	ensalada('de Atún', 'Hojas frescas, atún, jitomate y aguacate.', 95, [['Atún', 0.08]]),
	ensalada('de Pollo', 'Hojas frescas con pechuga de pollo a la plancha.', 95, [['Pechuga de pollo', 0.1]]),
	ensalada('de Res', 'Hojas frescas con tiras de res a la plancha.', 105, [['Res a la plancha', 0.1]]),
	{
		n: 'Molletes',
		d: 'Pan recién horneado con frijoles refritos y queso gratinado.',
		c: 'Molletes',
		p: 65,
		rec: [['Pan para mollete', 2], ['Frijoles refritos', 0.08], ['Queso gratinado', 0.06]],
		ops: [
			{ g: 'Variedad', n: 'Tradicional (queso gratinado)', def: true },
			{ g: 'Variedad', n: 'Con pollo deshebrado', x: 15, rec: [['Pechuga de pollo', 0.06]] },
			{ g: 'Variedad', n: 'Con res a la plancha', x: 20, rec: [['Res a la plancha', 0.06]] },
			{ g: 'Extras', n: 'Pico de gallo extra', multi: true, rec: [['Jitomate', 0.03]] },
			{ g: 'Extras', n: 'Aguacate', x: 15, multi: true, rec: [['Aguacate Hass', 0.04]] },
			{ g: 'Extras', n: 'Queso gratinado extra', x: 15, multi: true, rec: [['Queso gratinado', 0.05]] }
		]
	},
	{
		n: 'Chilaquiles caseros',
		d: 'Totopos crujientes con salsa recién hecha, crema y queso.',
		c: 'Chilaquiles',
		p: 75,
		rec: [['Totopos', 0.1], ['Crema', 0.03], ['Queso panela fresco', 0.03]],
		ops: [
			{ g: 'Proteína', n: 'Pollo deshebrado', def: true, rec: [['Pechuga de pollo', 0.08]] },
			{ g: 'Proteína', n: 'Res', x: 15, rec: [['Res a la plancha', 0.08]] },
			{ g: 'Proteína', n: 'Huevo', rec: [['Huevo', 2]] },
			{ g: 'Salsa', n: 'Verde tatemada', def: true, rec: [['Salsa verde', 0.12]] },
			{ g: 'Salsa', n: 'Roja de jitomate', rec: [['Salsa roja', 0.12]] },
			{ g: 'Extras', n: 'Queso extra', x: 15, multi: true, rec: [['Queso panela fresco', 0.04]] },
			{ g: 'Extras', n: 'Aguacate', x: 15, multi: true, rec: [['Aguacate Hass', 0.04]] },
			{ g: 'Extras', n: 'Crema extra', x: 8, multi: true, rec: [['Crema', 0.03]] },
			{ g: 'Extras', n: 'Frijoles refritos', x: 15, multi: true, rec: [['Frijoles refritos', 0.08]] }
		]
	},
	panini('Jamón', 'Jamón de pavo y queso panela en pan artesanal.', 65, [['Jamón de pavo', 0.06]]),
	panini('Pollo', 'Pechuga de pollo a la plancha y queso panela.', 75, [['Pechuga de pollo', 0.08]]),
	panini('Atoyac', 'Pechuga de pavo, aguacate, jitomate y espinaca.', 79, [['Jamón de pavo', 0.07], ['Jitomate', 0.03], ['Espinaca', 0.015]]),
	bebida('Jugo de naranja 500 ml', 'Recién exprimido, 100% natural y sin azúcar añadida.', 'Bebidas frías', 38, [['Naranja para jugo', 0.9]], hielo()),
	bebida('Jugo verde 500 ml', 'Naranja, espinaca, pepino y un toque de limón.', 'Bebidas frías', 45, [['Naranja para jugo', 0.6], ['Espinaca', 0.03], ['Pepino', 0.08]], hielo()),
	bebida('Agua fresca 500 ml', 'Jamaica, horchata o pepino-limón del día.', 'Bebidas frías', 25, [['Concentrado de agua fresca', 0.5]], hielo()),
	bebida('Agua fresca 1 litro', 'Jamaica, horchata o pepino-limón del día, en envase de 1 L.', 'Bebidas frías', 40, [['Concentrado de agua fresca', 1]], hielo()),
	bebida('Expresso', 'Café mexicano de grano recién molido.', 'Bebidas calientes', 45, [['Café de grano', 0.009]], [dobleShot]),
	bebida('Americano', 'Café de grano mexicano recién hecho.', 'Bebidas calientes', 45, [['Café de grano', 0.009]], [
		{ g: 'Leche', n: 'Sin leche', def: true },
		{ g: 'Leche', n: 'Deslactosada', x: 10, rec: [['Leche', 0.1]] },
		{ g: 'Leche', n: 'Avena', x: 10 },
		dobleShot
	]),
	bebida('Té', 'Infusión de hierbas.', 'Bebidas calientes', 35, [['Té de hierbas', 1]], [
		{ g: 'Sabor', n: 'Manzanilla', def: true },
		{ g: 'Sabor', n: 'Menta' },
		{ g: 'Sabor', n: 'Frutos rojos' }
	]),
	{
		n: 'Combo Amanecer',
		d: 'Panini de jamón y jugo de naranja de 500 ml.',
		c: 'Promociones',
		p: 89,
		rec: [['Pan para panini', 1], ['Queso panela fresco', 0.04], ['Jamón de pavo', 0.06], ['Naranja para jugo', 0.9]]
	},
	{
		n: 'Combo Ensalada',
		d: 'Ensalada de pollo y agua fresca de 500 ml.',
		c: 'Promociones',
		p: 115,
		rec: [['Lechuga y mezcla de hojas', 0.12], ['Jitomate', 0.05], ['Aguacate Hass', 0.04], ['Pechuga de pollo', 0.1], ['Concentrado de agua fresca', 0.5]]
	},
	{
		n: 'Combo Café y Panini',
		d: 'Panini de pollo y un Americano.',
		c: 'Promociones',
		p: 99,
		rec: [['Pan para panini', 1], ['Queso panela fresco', 0.04], ['Pechuga de pollo', 0.08], ['Café de grano', 0.009]]
	}
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
			// Aproximación: el croissant se suma al pan base en el descuento (el kiosco puede afinarlo después).
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
