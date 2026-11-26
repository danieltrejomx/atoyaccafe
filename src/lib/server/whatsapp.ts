// Ticket por WhatsApp Cloud API (Meta). TODO (builder kiosco): implementar.
// Credenciales: env.waToken y env.waPhoneId (WA_TOKEN, WA_PHONE_ID). Nunca en código.
// Referencia: legacy/webhook_whatsapp.php. En desarrollo y pruebas se mockea.

import type { Pedido } from '../types';

/** Manda el ticket del pedido al teléfono (solo dígitos con lada). Devuelve true si Meta lo aceptó. */
export declare function enviarTicket(telefono: string, pedido: Pedido): Promise<boolean>;
