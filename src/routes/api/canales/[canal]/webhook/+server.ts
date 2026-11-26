import { json } from '@sveltejs/kit';
import { canales, Ignorado, type ChannelAdapter } from '$lib/server/canales';
import { cuerpo, manejar } from '$lib/server/http';
import { crearPedido } from '$lib/server/pedidos';

export const POST = ({ request, params }) =>
	manejar(async () => {
		const a = canales[params.canal as ChannelAdapter['canal']];
		if (!a) return json({ error: 'Canal desconocido' }, { status: 404 });
		if (!(await a.verify(request))) return json({ error: 'Firma inválida' }, { status: 401 });
		try {
			const { pedido, creado } = crearPedido(await a.toPedido(await cuerpo(request)));
			// 200 siempre con firma válida para que la app no reintente; si aceptar falla solo se registra
			if (creado) await a.aceptar(pedido.externoId!).catch((e) => console.error(`[canales:${a.canal}] aceptar`, e));
			return { ok: true, pedidoId: pedido.id, turno: pedido.turno, creado };
		} catch (e) {
			if (e instanceof Ignorado) return { ok: true, ignorado: true };
			throw e;
		}
	});
