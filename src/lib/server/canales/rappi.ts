import type { ChannelAdapter } from './index';
import { armarPedido, cred, hmacHex, idDe, iguales, Ignorado, llamar } from './comun';

// Rappi Partners API. Casi todo sin confirmar contra la documentación oficial (portal con login): ver docs/CANALES.md.
const API = () => cred('RAPPI_API_URL') || 'https://services.rappi.com.mx/api/v2/restaurants-integrations-public-api';

const login = async () => {
	const id = cred('RAPPI_CLIENT_ID');
	const secreto = cred('RAPPI_CLIENT_SECRET');
	if (!id || !secreto) return null;
	const r = (await (
		await fetch(cred('RAPPI_AUTH_URL') || 'https://rests-integrations.auth0.com/oauth/token', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ client_id: id, client_secret: secreto, audience: 'https://int-public-api-v2/api', grant_type: 'client_credentials' })
		})
	).json()) as { access_token: string; expires_in: number };
	return { token: r.access_token, expiraEn: r.expires_in };
};

export const rappi: ChannelAdapter = {
	canal: 'rappi',
	async verify(request) {
		// Rappi-Signature: t=<ts>,sign=<hex>  con sign = HMAC-SHA256(secreto, `${t}.${cuerpo}`)  (sin confirmar)
		const secreto = cred('RAPPI_CLIENT_SECRET');
		const h = request.headers.get('rappi-signature');
		if (!secreto || !h) return false;
		const p = Object.fromEntries(h.split(',').map((s) => s.trim().split('=') as [string, string]));
		if (!p.t || !p.sign) return false;
		return iguales(p.sign.toLowerCase(), hmacHex(secreto, `${p.t}.${await request.clone().text()}`));
	},
	toPedido(payload: any) {
		if (payload?.event && payload.event !== 'NEW_ORDER') throw new Ignorado();
		const d = payload?.order_detail;
		if (!d?.order_id) throw new Ignorado();
		const c = payload.customer ?? {};
		const sub = (i: any) => (i.subitems ?? []).map((s: any) => s.name).join(', ');
		return armarPedido(
			'rappi',
			String(d.order_id),
			{ cliente: [c.first_name, c.last_name].filter(Boolean).join(' '), telefono: c.phone_number, notas: d.comments },
			(d.items ?? []).map((i: any) => ({
				sku: String(i.sku ?? ''),
				nombre: String(i.name ?? ''),
				precio: Math.round(Number(i.unit_price ?? 0)),
				cantidad: Number(i.quantity ?? 1),
				notas: [sub(i), i.comments].filter(Boolean).join(' | ') || undefined
			}))
		);
	},
	async aceptar(externoId) {
		await llamar('rappi', `${API()}/orders/${idDe(externoId)}/take/15`, { method: 'PUT' }, login);
	},
	async marcarListo(externoId) {
		await llamar('rappi', `${API()}/orders/${idDe(externoId)}/ready-for-pickup`, { method: 'PUT' }, login);
	}
};
