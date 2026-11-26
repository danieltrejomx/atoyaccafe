<script lang="ts" module>
	// Trazos de Lucide (ISC). Solo cadenas estáticas: seguro para {@html}.
	const P = {
		carrito: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
		mas: '<path d="M5 12h14M12 5v14"/>',
		menos: '<path d="M5 12h14"/>',
		cerrar: '<path d="M18 6 6 18M6 6l12 12"/>',
		check: '<path d="M20 6 9 17l-5-5"/>',
		'flecha-izq': '<path d="m12 19-7-7 7-7M19 12H5"/>',
		efectivo: '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
		tarjeta: '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>',
		transferencia: '<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2l8 5H4Z"/>',
		whatsapp: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
		borrar: '<path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2ZM18 9l-6 6M12 9l6 6"/>',
		cubiertos: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
		taza: '<path d="M10 2v2M14 2v2M6 2v2M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/>',
		terminal: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
		alerta: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3ZM12 9v4M12 17h.01"/>'
	};
	export type NombreIcono = keyof typeof P;
	export { P as iconos };
</script>

<script lang="ts">
	let { nombre, tam = 24, etiqueta }: { nombre: NombreIcono; tam?: 20 | 24 | 32 | 48; etiqueta?: string } = $props();
</script>

<svg
	width={tam}
	height={tam}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	role={etiqueta ? 'img' : undefined}
	aria-label={etiqueta}
	aria-hidden={etiqueta ? undefined : 'true'}
>
	{@html P[nombre]}
</svg>
