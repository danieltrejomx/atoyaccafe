<script lang="ts">
	let { categorias, activa, oncambiar }: { categorias: readonly string[]; activa: string; oncambiar: (c: string) => void } = $props();

	function teclas(e: KeyboardEvent) {
		const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
		if (!d) return;
		e.preventDefault();
		oncambiar(categorias[(categorias.indexOf(activa) + d + categorias.length) % categorias.length]);
	}
</script>

<div class="riel" role="tablist" aria-orientation="vertical" tabindex="-1" onkeydown={teclas}>
	{#each categorias as c (c)}
		<button
			role="tab"
			aria-selected={c === activa}
			tabindex={c === activa ? 0 : -1}
			class:activa={c === activa}
			onclick={() => oncambiar(c)}
		>
			<span>{c}</span>
		</button>
	{/each}
</div>

<style>
	.riel { display: flex; flex-direction: column; gap: var(--sp-1); width: 100%; }
	button {
		min-height: 64px;
		border: 0;
		border-radius: var(--r-pill);
		background: transparent;
		color: var(--c-texto-suave);
		font: 600 var(--fs-16) var(--f-titulo);
		text-transform: uppercase;
		letter-spacing: var(--ls-etiqueta);
		cursor: pointer;
		padding: 0 var(--sp-3);
		transition: background var(--dur-2) var(--ease-salida), color var(--dur-2);
		touch-action: manipulation;
	}
	button.activa { background: var(--c-blanco); color: var(--c-bosque); font-weight: 700; box-shadow: var(--sh-1); }
	button:focus-visible { outline: none; box-shadow: var(--foco); }
</style>
