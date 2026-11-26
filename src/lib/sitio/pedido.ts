import { NEGOCIO, enlaceWa, pesos } from './negocio';

export interface Linea { nombre: string; precio: number; cantidad: number }
export interface Datos { nombre: string; modo: 'recoger' | 'domicilio'; direccion: string; nota: string }

export const totalLineas = (l: Linea[]) => l.reduce((s, x) => s + x.precio * x.cantidad, 0);

/** Arma el enlace de WhatsApp con el pedido. Los precios son de referencia: el local confirma. */
export function enlacePedido(lineas: Linea[], d: Datos): string {
	const filas = lineas.map((l) => `${l.cantidad} x ${l.nombre} (${pesos(l.precio * l.cantidad)})`);
	const texto = [
		`Hola, soy ${d.nombre.trim()}. Quiero hacer un pedido:`,
		...filas,
		`Total: ${pesos(totalLineas(lineas))}`,
		d.modo === 'recoger' ? 'Paso a recogerlo en barra.' : `Entrega en: ${d.direccion.trim()}`,
		...(d.nota.trim() ? [`Nota: ${d.nota.trim()}`] : [])
	].join('\n');
	return enlaceWa(texto);
}

export { NEGOCIO };
