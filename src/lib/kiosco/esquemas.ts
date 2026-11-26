import { z } from 'zod';

const pedidoId = z.number().int().positive();
export const cobroSchema = z.object({ pedidoId });
/** Teléfono de 10 dígitos; el servidor antepone la lada de México. */
export const ticketSchema = z.object({ pedidoId, telefono: z.string().regex(/^\d{10}$/) });
