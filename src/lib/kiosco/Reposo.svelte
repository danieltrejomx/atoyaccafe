<script lang="ts">
	let { onentrar }: { onentrar: () => void } = $props();
</script>

<button class="reposo" onclick={onentrar}>
	<img src="/img/logo.svg" alt="Atoyac Café" />
	<h1>Toca para ordenar</h1>
	<p>Fresco, rápido y a tu gusto</p>
</button>

<style>
	.reposo {
		width: 100%;
		height: 100%;
		border: 0;
		background: var(--c-bosque);
		color: var(--c-texto-inverso);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--sp-4);
		cursor: pointer;
		touch-action: manipulation;
	}
	img { width: 280px; filter: brightness(0) invert(1); animation: pulso 3s ease-in-out infinite; }
	h1 { margin: var(--sp-5) 0 0; font: 600 var(--fs-72) var(--f-titulo); line-height: var(--lh-titulo); }
	p { margin: 0; font-size: var(--fs-24); color: var(--c-menta-tv); }
	@keyframes pulso { 50% { opacity: 0.6; } }
	@media (prefers-reduced-motion: reduce) { img { animation: none; } }
</style>
