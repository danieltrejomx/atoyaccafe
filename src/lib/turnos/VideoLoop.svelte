<script lang="ts">
	// Video mudo en bucle; si el archivo no existe, muestra un marcador animado.
	let { src, texto, tono }: { src: string; texto: string; tono: 'bosque' | 'barro' } = $props();
	let falla = $state(false);
	let video = $state<HTMLVideoElement>();
	// El error puede dispararse antes de hidratar (HTML del servidor): se revisa también al montar.
	$effect(() => {
		if (video && (video.error || video.networkState === video.NETWORK_NO_SOURCE)) falla = true;
	});
</script>

<div class="caja {tono}">
	{#if !falla}
		<video bind:this={video} {src} muted loop autoplay playsinline onerror={() => (falla = true)}></video>
	{/if}
	{#if falla}
		<div class="marcador">
			<img src="/img/logo.svg" alt="" />
			<p>{texto}</p>
		</div>
	{/if}
</div>

<style>
	.caja {
		position: relative;
		overflow: hidden;
		height: 100%;
		color: var(--c-texto-inverso);
	}
	.bosque { background: var(--c-bosque); }
	.barro { background: var(--c-barro-texto); }
	video { width: 100%; height: 100%; object-fit: cover; display: block; }
	.marcador {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 40px;
		background: radial-gradient(circle at 50% 40%, rgba(247, 243, 236, 0.16), transparent 60%);
		animation: respira 6s ease-in-out infinite;
	}
	img { width: 360px; filter: brightness(0) invert(1) sepia(0.2); animation: pulso 3s ease-in-out infinite; }
	p { font: 600 56px/1.2 var(--f-titulo); text-align: center; max-width: 800px; margin: 0; }
	@keyframes pulso { 50% { opacity: 0.6; transform: scale(1.04); } }
	@keyframes respira { 50% { background-size: 140% 140%; filter: brightness(1.12); } }
	@media (prefers-reduced-motion: reduce) { .marcador, img { animation: none; } }
</style>
