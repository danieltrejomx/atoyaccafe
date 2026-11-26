<script lang="ts">
	let { titulo, descripcion, imagen = '/img/local-interior.jpg' }: { titulo: string; descripcion: string; imagen?: string } = $props();
	const t = $derived(titulo === 'Atoyac Café' ? titulo : `${titulo} | Atoyac Café`);
</script>

<svelte:head>
	<title>{t}</title>
	<meta name="description" content={descripcion} />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="es_MX" />
	<meta property="og:site_name" content="Atoyac Café" />
	<meta property="og:title" content={t} />
	<meta property="og:description" content={descripcion} />
	<meta property="og:image" content={imagen} />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>
