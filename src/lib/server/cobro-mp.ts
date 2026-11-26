// Cobro con terminal Mercado Pago Point, desde el servidor. TODO (builder kiosco): implementar.
// Credenciales: env.mpToken y env.mpTerminal (variables MP_TOKEN, MP_TERMINAL). Nunca en código.
// Referencia: legacy/server.py (POST https://api.mercadopago.com/v1/orders, type "point").
// En desarrollo y pruebas se mockea: no llamar a la API real.

export interface CobroMP {
	/** id de la orden en Mercado Pago */
	ordenId: string;
	estado: 'pendiente' | 'aprobado' | 'rechazado' | 'cancelado';
}

/** Envía el monto (pesos) a la terminal Point; la referencia externa es el id del pedido. */
export declare function iniciarCobro(pedidoId: number, monto: number): Promise<CobroMP>;
/** Consulta el estado de una orden ya iniciada. */
export declare function consultarCobro(ordenId: string): Promise<CobroMP>;
