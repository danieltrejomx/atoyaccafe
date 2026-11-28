<script lang="ts">
	const P: Record<string, string> = {
		plus: 'M5 12h14M12 5v14',
		menos: 'M5 12h14',
		x: 'M18 6 6 18M6 6l12 12',
		volumen: 'M11 5 6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14',
		silencio: 'M11 5 6 9H2v6h4l5 4V5zM22 9l-6 6M16 9l6 6',
		salir: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
		borrar: 'M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zM18 9l-6 6M12 9l6 6',
		alerta: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
		megafono: 'M12 6V2H8M6 11V9a6 6 0 0 1 12 0v2M2 15h2l2-4h12l2 4h2M7 15v4a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-4'
	};
	let { nombre, tam = 20 }: { nombre: string; tam?: number } = $props();
</script>

<svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={P[nombre]} /></svg>
