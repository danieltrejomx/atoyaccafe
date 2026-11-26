// Ticket por WhatsApp Cloud API (Meta). Credenciales solo de env (WA_TOKEN, WA_PHONE_ID).
// Sin credenciales solo deja el texto en el log: nunca llama a Meta.
import { env } from './env';
import type { Pedido } from '../types';

export function textoTicket(p: Pedido): string {
	const lineas = p.items.map((i) => {
		const ops = i.opciones.map((o) => o.nombre).join(', ');
		return `${i.cantidad} x ${i.nombre}${ops ? ` (${ops})` : ''}  $${i.precioUnit * i.cantidad}`;
	});
	const pago =
		p.pagoEstado === 'pagado' ? 'Pagado' : p.pagoMetodo === 'transferencia' ? 'Pendiente: pasa a caja con tu comprobante' : 'Pendiente: pasa a caja';
	return [
		'Atoyac Café',
		`Tu turno es el ${p.turno}`,
		...lineas,
		`Total: $${p.total} MXN`,
		pago,
		'Te avisamos en la pantalla cuando esté listo.'
	].join('\n');
}

/** Manda el ticket del pedido al teléfono (solo dígitos con lada). Devuelve true si Meta lo aceptó. */
export async function enviarTicket(telefono: string, pedido: Pedido): Promise<boolean> {
	const texto = textoTicket(pedido);
	if (!env.waToken || !env.waPhoneId) {
		console.log(`[whatsapp simulado] a ${telefono}:\n${texto}`);
		return true;
	}
	try {
		const r = await fetch(`https://graph.facebook.com/v21.0/${env.waPhoneId}/messages`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${env.waToken}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({ messaging_product: 'whatsapp', to: telefono, type: 'text', text: { body: texto } }),
			signal: AbortSignal.timeout(10_000)
		});
		if (!r.ok) console.error('WhatsApp', r.status, (await r.text()).slice(0, 300));
		return r.ok;
	} catch (e) {
		console.error('WhatsApp', e);
		return false;
	}
}
