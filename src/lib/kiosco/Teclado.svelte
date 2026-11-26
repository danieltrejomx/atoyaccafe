<script lang="ts">
	import Icono from '$lib/ui/Icono.svelte';

	let { valor = $bindable(''), max = 10 }: { valor?: string; max?: number } = $props();
	const teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'borrar'];
</script>

<div class="teclado">
	{#each teclas as t (t)}
		{#if t === ''}
			<span></span>
		{:else if t === 'borrar'}
			<button aria-label="Borrar" onclick={() => (valor = valor.slice(0, -1))}><Icono nombre="borrar" tam={32} /></button>
		{:else}
			<button onclick={() => valor.length < max && (valor += t)}>{t}</button>
		{/if}
	{/each}
</div>

<style>
	.teclado { display: grid; grid-template-columns: repeat(3, 72px); gap: var(--sp-4); justify-content: center; }
	button {
		width: 72px;
		height: 72px;
		border: 0;
		border-radius: 50%;
		background: var(--c-blanco);
		box-shadow: var(--sh-1);
		color: var(--c-bosque);
		font: 600 var(--fs-32) var(--f-titulo);
		cursor: pointer;
		display: grid;
		place-items: center;
		touch-action: manipulation;
		transition: transform var(--dur-1);
	}
	button:active { transform: scale(0.95); }
	button:focus-visible { outline: none; box-shadow: var(--foco); }
</style>
