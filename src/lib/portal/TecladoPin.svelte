<script lang="ts">
	import Icono from './Icono.svelte';

	let { pin = $bindable(''), max = 6, alCompletar }: { pin?: string; max?: number; alCompletar?: () => void } = $props();
	const teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'borrar'];

	function tocar(t: string) {
		if (t === 'borrar') pin = pin.slice(0, -1);
		else if (pin.length < max) pin += t;
	}
</script>

<svelte:window onkeydown={(e) => {
	if (/^\d$/.test(e.key)) tocar(e.key);
	else if (e.key === 'Backspace') tocar('borrar');
	else if (e.key === 'Enter') alCompletar?.();
}} />

<div class="puntos" aria-label="PIN" role="img">
	{#each { length: max } as _, i}<span class:lleno={i < pin.length}></span>{/each}
</div>
<div class="teclado">
	{#each teclas as t}
		{#if t === ''}<span></span>
		{:else}
			<button type="button" onclick={() => tocar(t)} aria-label={t === 'borrar' ? 'Borrar' : t}>
				{#if t === 'borrar'}<Icono nombre="borrar" tam={24} />{:else}{t}{/if}
			</button>
		{/if}
	{/each}
</div>

<style>
	.puntos { display: flex; gap: var(--sp-3); justify-content: center; margin: var(--sp-4) 0; }
	.puntos span { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--c-hoja); }
	.puntos .lleno { background: var(--c-hoja); }
	.teclado { display: grid; grid-template-columns: repeat(3, 72px); gap: var(--sp-3); justify-content: center; }
	button { height: 72px; border-radius: 50%; border: 0; background: var(--c-blanco); box-shadow: var(--sh-1); font: 600 var(--fs-24) var(--f-titulo); color: var(--c-texto); cursor: pointer; display: grid; place-items: center; }
	button:active { transform: scale(.95); }
	button:focus-visible { outline: none; box-shadow: var(--foco); }
</style>
