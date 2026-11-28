import type { Opcion, Producto } from '$lib/types';

export interface LineaCarrito {
	clave: string;
	producto: Producto;
	opciones: Opcion[];
	cantidad: number;
	notas: string;
}

/** Precio estimado para mostrar; el servidor recalcula el real al crear el pedido. */
export const precioUnit = (l: Pick<LineaCarrito, 'producto' | 'opciones'>) =>
	l.producto.precio + l.opciones.reduce((s, o) => s + o.precioExtra, 0);

class Carrito {
	lineas = $state<LineaCarrito[]>([]);
	cantidad = $derived(this.lineas.reduce((s, l) => s + l.cantidad, 0));
	total = $derived(this.lineas.reduce((s, l) => s + precioUnit(l) * l.cantidad, 0));

	agregar(producto: Producto, opciones: Opcion[], cantidad: number, notas = '') {
		const clave = `${producto.id}:${opciones.map((o) => o.id).sort((a, b) => a - b)}:${notas}`;
		const ya = this.lineas.find((l) => l.clave === clave);
		if (ya) ya.cantidad += cantidad;
		else this.lineas.push({ clave, producto, opciones, cantidad, notas });
	}
	cambiar(clave: string, delta: number) {
		const l = this.lineas.find((x) => x.clave === clave);
		if (!l) return;
		l.cantidad = Math.min(50, l.cantidad + delta);
		if (l.cantidad <= 0) this.quitar(clave);
	}
	quitar(clave: string) {
		this.lineas = this.lineas.filter((l) => l.clave !== clave);
	}
	vaciar() {
		this.lineas = [];
	}
	/** Items para POST /api/pedidos (sin precios). */
	items() {
		return this.lineas.map((l) => ({ productoId: l.producto.id, cantidad: l.cantidad, opcionIds: l.opciones.map((o) => o.id), notas: l.notas || undefined }));
	}
}

export const carrito = new Carrito();
