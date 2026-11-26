<script lang="ts">
	import '$lib/portal/portal.css';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { api } from '$lib/api';
	import { NAV } from '$lib/portal/acceso';
	import Icono from '$lib/portal/Icono.svelte';

	let { data, children } = $props();
	const items = $derived(data.usuario ? NAV.filter((n) => n.roles.includes(data.usuario!.rol)) : []);

	async function salir() {
		await api.logout().catch(() => {});
		await goto('/portal/login', { invalidateAll: true });
	}
</script>

<svelte:head><title>Portal | Atoyac Café</title></svelte:head>

<div class="portal">
	{#if data.usuario}
		<nav>
			<strong class="marca">Atoyac</strong>
			{#each items as n}
				<a href={n.href} aria-current={page.url.pathname.replace(/\/$/, '') === n.href ? 'page' : undefined}>{n.texto}</a>
			{/each}
			<span class="yo">{data.usuario.nombre}</span>
			<button class="btn quieto chico" onclick={salir}><Icono nombre="salir" /> Salir</button>
		</nav>
	{/if}
	{@render children()}
</div>

<style>
	nav { display: flex; align-items: center; gap: var(--sp-4); padding: var(--sp-2) var(--sp-5); background: var(--c-bosque); color: var(--c-texto-inverso); position: sticky; top: 0; z-index: var(--z-barra); flex-wrap: wrap; }
	.marca { font: 700 var(--fs-20) var(--f-titulo); margin-right: var(--sp-3); }
	a { color: var(--c-menta-tv); text-decoration: none; font: 600 var(--fs-16) var(--f-titulo); padding: var(--sp-2) var(--sp-3); border-radius: var(--r-pill); }
	a[aria-current] { color: var(--c-bosque); background: var(--c-papel); }
	a:focus-visible { outline: none; box-shadow: var(--foco); }
	.yo { margin-left: auto; color: var(--c-menta-tv); font-size: var(--fs-14); }
	nav :global(.btn.quieto) { color: var(--c-menta-tv); }
</style>
