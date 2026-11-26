import type { NombreEvento } from '$lib/types';
import { suscribir } from '$lib/server/sse';
import type { RequestHandler } from './$types';

// Sin sesión (TV, kiosco) solo se ve lo mínimo: turno, estado y "listo". Los datos de clientes y el stock, no.
const PUBLICOS: NombreEvento[] = ['pedido.creado', 'pedido.actualizado', 'turno.listo'];

export const GET: RequestHandler = ({ locals, request }) => {
	const interno = !!locals.usuario;
	const enc = new TextEncoder();
	let baja = () => {};
	let latido: ReturnType<typeof setInterval>;

	const stream = new ReadableStream({
		start(controller) {
			const enviar = (texto: string) => {
				try {
					controller.enqueue(enc.encode(texto));
				} catch {
					limpiar();
				}
			};
			const limpiar = () => {
				baja();
				clearInterval(latido);
			};
			enviar('retry: 3000\n\n');
			baja = suscribir((evento, data) => {
				if (!interno && !PUBLICOS.includes(evento)) return;
				let d: unknown = data;
				if (!interno && 'estado' in (data as object)) {
					const p = data as { id: number; turno: number; estado: string };
					d = { id: p.id, turno: p.turno, estado: p.estado };
				}
				enviar(`event: ${evento}\ndata: ${JSON.stringify(d)}\n\n`);
			});
			latido = setInterval(() => enviar(': latido\n\n'), 20_000);
			request.signal.addEventListener('abort', () => {
				limpiar();
				try {
					controller.close();
				} catch {
					/* ya cerrado */
				}
			});
		},
		cancel() {
			baja();
			clearInterval(latido);
		}
	});

	return new Response(stream, {
		headers: {
			'content-type': 'text/event-stream',
			'cache-control': 'no-cache, no-transform',
			connection: 'keep-alive',
			'x-accel-buffering': 'no'
		}
	});
};
