<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icono, { type NombreIcono } from './Icono.svelte';

	let {
		variante = 'primario',
		tamano = 'md',
		icono,
		cargando = false,
		disabled = false,
		href,
		onclick,
		etiqueta,
		children
	}: {
		variante?: 'primario' | 'pago' | 'secundario' | 'quieto' | 'peligro';
		tamano?: 'md' | 'lg' | 'xl';
		icono?: NombreIcono;
		cargando?: boolean;
		disabled?: boolean;
		href?: string;
		onclick?: (e: MouseEvent) => void;
		etiqueta?: string;
		children?: Snippet;
	} = $props();
	const inactivo = $derived(disabled || cargando);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<svelte:element
	this={href ? 'a' : 'button'}
	class="btn {variante} {tamano}"
	{href}
	type={href ? undefined : 'button'}
	disabled={href ? undefined : inactivo}
	aria-disabled={inactivo || undefined}
	aria-label={etiqueta}
	onclick={inactivo ? undefined : onclick}
>
	{#if icono}<Icono nombre={icono} tam={tamano === 'md' ? 20 : 24} />{/if}
	{#if cargando}Procesando…{:else}{@render children?.()}{/if}
</svelte:element>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--sp-2);
		border: 1.5px solid transparent;
		border-radius: var(--r-pill);
		font: 600 var(--fs-16) var(--f-titulo);
		cursor: pointer;
		text-decoration: none;
		transition: transform var(--dur-1), filter var(--dur-1);
		touch-action: manipulation;
	}
	.md { height: var(--toque); padding: 0 20px; font-size: var(--fs-16); }
	.lg { height: var(--toque-kiosco); padding: 0 28px; font-size: var(--fs-18); }
	.xl { height: var(--toque-kiosco-xl); padding: 0 36px; font-size: var(--fs-24); }
	.primario { background: var(--c-hoja-fuerte); color: #fff; }
	.pago { background: var(--c-barro); color: #fff; }
	.secundario { background: transparent; color: var(--c-bosque); border-color: var(--c-linea-fuerte); }
	.quieto { background: transparent; color: var(--c-hoja); }
	.peligro { background: transparent; color: var(--c-cancelado); border-color: var(--c-cancelado); }
	@media (hover: hover) { .btn:hover { filter: brightness(0.94); } }
	.btn:active { transform: scale(0.97); }
	.btn:focus-visible { outline: none; box-shadow: var(--foco); }
	.btn:disabled, .btn[aria-disabled='true'] { opacity: 0.45; cursor: default; transform: none; filter: none; }
</style>
