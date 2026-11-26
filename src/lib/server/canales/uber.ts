import type { ChannelAdapter } from './index';
import { armarPedido, cred, hmacHex, idDe, iguales, Ignorado, llamar } from './comun';

// Uber Eats Marketplace API. Confirmado en docs: evento orders.notification, GET /eats/order/{id},
// POST /eats/orders/{id}/accept_pos_order. NO confirmado: ver docs/CANALES.md.
const API = () => cred('UBER_API_URL') || 'https://api.uber.com/v1';

const login = async () => {
	const id = cred('UBER_CLIENT_ID');
	const secreto = cred('UBER_CLIENT_SECRET');
	if (!id || !secreto) return null;
	const r = (await (
		await fetch(cred('UBER_AUTH_URL') || 'https://auth.uber.com/oauth/v2/token', {
			method: 'POST',
			body: new URLSearchParams({ client_id: id, client_secret: secreto, grant_type: 'client_credentials', scope: 'eats.order eats.store.orders.read' })
		})
	).json()) as { access_token: string; expires_in: number };
	return { token: r.access_token, expiraEn: r.expires_in };
};

const pesos = (centavos: unknown) => Math.round(Number(centavos ?? 0) / 100);

export const uber: ChannelAdapter = {
	canal: 'uber',
	async verify(request) {
		const secreto = cred('UBER_CLIENT_SECRET');
		const firma = request.headers.get('x-uber-signature');
		if (!secreto || !firma) return false;
		return iguales(firma.toLowerCase(), hmacHex(secreto, await request.clone().text()));
	},
	async toPedido(payload: any) {
		// El webhook solo avisa (orders.notification); el detalle se pide por API.
		if (payload?.event_type !== 'orders.notification' || payload.meta?.status !== 'created')
			throw new Ignorado();
		const id = String(payload.meta.resource_id);
		const o: any = await llamar('uber', `${API()}/eats/order/${encodeURIComponent(id)}`, {}, login);
		if (!o) throw new Error('Uber Eats deshabilitado: faltan UBER_CLIENT_ID / UBER_CLIENT_SECRET');
		const orden = o.order ?? o;
		return armarPedido(
			'uber',
			id,
			{
				cliente: orden.eater?.first_name,
				telefono: orden.eater?.phone,
				notas: orden.cart?.special_instructions
			},
			(orden.cart?.items ?? []).map((i: any) => ({
				sku: String(i.external_data ?? ''),
				nombre: String(i.title ?? ''),
				precio: pesos(i.price?.unit_price?.amount),
				cantidad: Number(i.quantity ?? 1),
				notas: i.special_instructions
			}))
		);
	},
	async aceptar(externoId) {
		await llamar('uber', `${API()}/eats/orders/${idDe(externoId)}/accept_pos_order`, { method: 'POST', json: { reason: 'accepted by Atoyac' } }, login);
	},
	async marcarListo(externoId) {
		await llamar('uber', `${API()}/eats/orders/${idDe(externoId)}/ready`, { method: 'POST', json: {} }, login);
	}
};
