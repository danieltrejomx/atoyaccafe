import type { CrearPedidoInput } from '../../schemas';
import type { Canal } from '../../types';
import { suscribir } from '../sse';
import { didi } from './didi';
import { rappi } from './rappi';
import { uber } from './uber';

export { Ignorado } from './comun';

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

export const canales: Partial<Record<ChannelAdapter['canal'], ChannelAdapter>> = { didi, rappi, uber };

const g = globalThis as unknown as { __atoyacCanales?: boolean };

/** Se llama una vez al arrancar (hooks.server.ts): al pasar un pedido de app a "listo", avisa a la app. */
export function iniciarCanales() {
	if (g.__atoyacCanales) return;
	g.__atoyacCanales = true;
	const avisados = new Set<number>();
	suscribir((evento, data) => {
		if (evento !== 'pedido.actualizado') return;
		const p = data as { id: number; canal: Canal; estado: string; externoId?: string | null };
		const a = canales[p.canal as ChannelAdapter['canal']];
		if (p.estado !== 'listo' || !a || !p.externoId || avisados.has(p.id)) return;
		avisados.add(p.id);
		a.marcarListo(p.externoId).catch((e) => console.error(`[canales:${p.canal}] marcarListo`, e));
	});
}
