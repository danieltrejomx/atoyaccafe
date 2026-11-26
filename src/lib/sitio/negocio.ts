// Datos fijos del negocio (fuente: legacy/index.html y docs/DISENO.md).
export const NEGOCIO = {
	nombre: 'Atoyac Café',
	direccion: 'Av. Popocatépetl 289, Local A, Santa Cruz Atoyac',
	zona: 'Eje 8 Sur, entre Av. México-Coyoacán y Uxmal. Benito Juárez, CDMX',
	horario: 'Lun a sáb, 7:00 a 21:00',
	telefono: '56 5912 2497',
	waNumero: '525659122497',
	mapa: 'https://www.google.com/maps/search/?api=1&query=Av.+Popocatépetl+289+Santa+Cruz+Atoyac+CDMX',
	// Sábado 5 de diciembre de 2026, 9:00, hora CDMX (UTC-6, sin horario de verano)
	inauguracion: '2026-12-05T09:00:00-06:00'
} as const;

export const enlaceWa = (texto: string) =>
	`https://wa.me/${NEGOCIO.waNumero}?text=${encodeURIComponent(texto)}`;

export const pesos = (n: number) => `$${n.toLocaleString('es-MX')}`;
