import type { CrearPedidoInput } from '../../schemas';
import type { Canal } from '../../types';

/** Un adaptador por app de delivery. Todos hablan con el resto del sistema solo por esta interfaz. */
export interface ChannelAdapter {
	canal: Extract<Canal, 'didi' | 'rappi' | 'uber'>;
	/** Verifica la firma del webhook. Debe leer el cuerpo con request.clone(). */
	verify(request: Request): Promise<boolean>;
	/** Convierte el payload de la app (por SKU) a nuestro formato. Usa externoId = "<canal>:<id>". */
	toPedido(payload: unknown): Promise<CrearPedidoInput> | CrearPedidoInput;
	/** Acepta el pedido en la app. */
	aceptar(externoId: string): Promise<void>;
	/** Avisa a la app que el pedido está listo. */
	marcarListo(externoId: string): Promise<void>;
}

/** TODO (builder canales): registrar didi, rappi y uber aquí. */
export const canales: Partial<Record<ChannelAdapter['canal'], ChannelAdapter>> = {};

/**
 * Se llama una vez al arrancar (hooks.server.ts). TODO (builder canales): suscribirse con `suscribir`
 * de sse.ts a 'pedido.actualizado' y, cuando estado === 'listo' y el canal tiene adaptador y externoId,
 * llamar a adaptador.marcarListo(externoId) sin bloquear (capturar y registrar errores).
 */
export function iniciarCanales() {}
