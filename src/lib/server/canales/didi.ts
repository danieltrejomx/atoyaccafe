import type { ChannelAdapter } from './index';
import { armarPedido, cred, hmacHex, idDe, iguales, Ignorado, llamar } from './comun';

// DiDi Food Open Platform. Formato de firma, payload y endpoints SIN confirmar (docs solo para socios): ver docs/CANALES.md.
const API = () => cred('DIDI_API_URL') || 'https://api.didi-food.com';

const login = async () => {
	const app = cred('DIDI_APP_ID');
	const secreto = cred('DIDI_APP_SECRET');
	if (!app || !secreto) return null;
	const r: any = await (
		await fetch(`${API()}/v1/auth/authtoken/signin`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ app_id: app, app_secret: secreto, shop_id: cred('DIDI_SHOP_ID') })
		})
	).json();
	return { token: r.data?.auth_token, expiraEn: Number(r.data?.token_expiration_time ?? 3600) };
};

export const didi: ChannelAdapter = {
	canal: 'didi',
	async verify(request) {
		// Supuesto: HMAC-SHA256 hex del cuerpo con DIDI_APP_SECRET en X-Didi-Signature (sin confirmar)
		const secreto = cred('DIDI_APP_SECRET');
		const firma = request.headers.get('x-didi-signature');
		if (!secreto || !firma) return false;
		return iguales(firma.toLowerCase(), hmacHex(secreto, await request.clone().text()));
	},
	toPedido(payload: any) {
		const o = payload?.data ?? payload;
		if ((payload?.type && payload.type !== 'orderNew') || !o?.order_id) throw new Ignorado();
		const dir = o.receive_address ?? {};
		return armarPedido(
			'didi',
			String(o.order_id),
			{ cliente: dir.name, telefono: dir.phone, notas: o.remark },
			(o.order_items ?? []).map((i: any) => ({
				sku: String(i.app_item_id ?? ''),
				nombre: String(i.name ?? ''),
				precio: Math.round(Number(i.price ?? 0) / 100),
				cantidad: Number(i.amount ?? 1),
				notas: i.remark
			}))
		);
	},
	async aceptar(externoId) {
		await post('/v1/order/order/confirm', externoId);
	},
	async marcarListo(externoId) {
		await post('/v1/order/order/ready', externoId);
	}
};

// DiDi pide el auth_token dentro del cuerpo, no en el encabezado.
async function post(ruta: string, externoId: string) {
	const r: any = await login();
	if (!r) return void console.warn(`[canales:didi] sin credenciales, no se llamó ${ruta}`);
	await llamar('didi', API() + ruta, { method: 'POST', json: { auth_token: r.token, order_id: idDe(externoId) } });
}
