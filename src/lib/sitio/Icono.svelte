<script lang="ts">
	// Trazos de Lucide (ISC). Solo los que usa el sitio.
	const D = {
		pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0116 0zM12 10m-3 0a3 3 0 106 0 3 3 0 10-6 0',
		reloj: 'M12 6v6l4 2M12 22a10 10 0 100-20 10 10 0 000 20z',
		whatsapp: 'M3 21l1.7-5A8.5 8.5 0 1112 20.5a8.5 8.5 0 01-4-1L3 21z',
		moto: 'M5 18m-3 0a3 3 0 106 0 3 3 0 10-6 0M19 18m-3 0a3 3 0 106 0 3 3 0 10-6 0M8 18h8M12 6h3l3 6M5 15l3-6h4',
		tienda: 'M3 9l1-5h16l1 5M3 9h18M3 9v11h18V9M9 20v-6h6v6',
		hoja: 'M11 20A7 7 0 019.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10zM2 21c0-3 1.85-5.4 5.2-6.7',
		mas: 'M12 5v14M5 12h14',
		menos: 'M5 12h14',
		menu: 'M4 6h16M4 12h16M4 18h16',
		cerrar: 'M18 6L6 18M6 6l12 12',
		flecha: 'M5 12h14M12 5l7 7-7 7'
	};
	let { nombre, tam = 20 }: { nombre: keyof typeof D; tam?: 20 | 24 | 32 } = $props();
</script>

<svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={D[nombre]} /></svg>
