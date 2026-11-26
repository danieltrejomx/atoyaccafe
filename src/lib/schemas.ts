// Esquemas Zod de entrada. Compartidos: el servidor los usa para validar y el cliente para tipar.
import { z } from 'zod';
import { CANALES, ESTADOS, PAGO_METODOS } from './types';

const id = z.number().int().positive();

export const crearPedidoSchema = z.object({
	canal: z.enum(CANALES),
	/** Id del pedido en la app externa; con él la creación es idempotente. Convención: "didi:123". */
	externoId: z.string().min(1).max(100).optional(),
	cliente: z.string().trim().max(60).optional(),
	/** WhatsApp para el ticket, solo dígitos con lada (ej. 5215512345678) */
	telefono: z.string().regex(/^\d{10,15}$/).optional(),
	pagoMetodo: z.enum(PAGO_METODOS).optional(),
	notas: z.string().max(300).optional(),
	items: z
		.array(
			z.object({
				productoId: id,
				cantidad: z.number().int().min(1).max(50),
				opcionIds: z.array(id).max(20).default([]),
				notas: z.string().max(200).optional()
			})
		)
		.min(1)
		.max(50)
});
export type CrearPedidoInput = z.infer<typeof crearPedidoSchema>;

export const patchPedidoSchema = z
	.object({
		estado: z.enum(ESTADOS).optional(),
		/** Confirmar cobro (caja). El método puede corregirse al confirmar. */
		pagado: z.literal(true).optional(),
		pagoMetodo: z.enum(PAGO_METODOS).optional()
	})
	.refine((v) => v.estado || v.pagado, 'Indica estado o pagado');
export type PatchPedidoInput = z.infer<typeof patchPedidoSchema>;

export const loginSchema = z.object({ pin: z.string().regex(/^\d{4,8}$/, 'PIN inválido') });

export const insumoPatchSchema = z
	.object({
		id,
		/** ajuste: delta con signo; merma: cantidad positiva que se resta; compra: positiva que se suma */
		tipo: z.enum(['ajuste', 'merma', 'compra']).optional(),
		cantidad: z.number().finite().optional(),
		nota: z.string().max(200).optional(),
		minimo: z.number().finite().min(0).optional()
	})
	.refine((v) => (v.tipo && v.cantidad !== undefined && v.cantidad !== 0) || v.minimo !== undefined, {
		message: 'Indica tipo y cantidad, o minimo'
	});
export type InsumoPatchInput = z.infer<typeof insumoPatchSchema>;

const linea = z.object({ insumoId: id, cantidad: z.number().positive().finite() });
export const recetaSchema = z.object({
	base: z.array(linea).max(50),
	opciones: z.array(z.object({ opcionId: id, lineas: z.array(linea).max(50) })).max(100).default([])
});
export type RecetaInput = z.infer<typeof recetaSchema>;
export interface RecetaRespuesta extends RecetaInput {
	productoId: number;
}

export const pedidosQuerySchema = z.object({
	canal: z.enum(CANALES).optional(),
	estado: z.enum(ESTADOS).optional()
});
