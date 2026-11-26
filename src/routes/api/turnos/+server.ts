import { json } from '@sveltejs/kit';
import { turnosActuales } from '$lib/server/turnos';

export const GET = () => json(turnosActuales());
