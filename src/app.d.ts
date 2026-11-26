import type { Rol } from '$lib/types';

declare global {
	namespace App {
		interface Locals {
			usuario: { id: number; nombre: string; rol: Rol } | null;
		}
	}
}

export {};
