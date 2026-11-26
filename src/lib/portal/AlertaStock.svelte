<script lang="ts">
	import type { Insumo } from '$lib/types';
	import Icono from './Icono.svelte';

	let { insumo }: { insumo: Insumo } = $props();
	const n = $derived(insumo.nombre.toLowerCase());
</script>

<span class="alerta" role="status">
	<Icono nombre="alerta" tam={16} />
	{#if insumo.stock <= 0}Se acabó: {n}. Los platillos que lo usan salen como agotados.
	{:else}Queda poco {n}: {insumo.stock} {insumo.unidad} (mínimo {insumo.minimo}){/if}
</span>

<style>
	.alerta { display: inline-flex; gap: var(--sp-2); align-items: center; color: var(--c-peligro); font-size: var(--fs-14); font-weight: 600; }
</style>
