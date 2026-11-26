<script lang="ts">
	import '$lib/portal/portal.css';
	import { page } from '$app/state';
	import { NAV } from '$lib/portal/acceso';

	let { data, children } = $props();
	const enCaja = $derived(page.url.pathname.replace(/\/$/, '') === '/portal/caja');
	const items = $derived(data.usuario ? NAV.filter((n) => n.roles.includes(data.usuario!.rol)) : []);
</script>

<svelte:head><title>Portal | Atoyac Café</title></svelte:head>

<div class="portal">
	{#if data.usuario && !enCaja}
		<nav>
			<strong class="marca">Atoyac</strong>
			{#each items as n}
				<a href={n.href} aria-current={page.url.pathname.replace(/\/$/, '') === n.href ? 'page' : undefined}>{n.texto}</a>
			{/each}
			<span class="yo">{data.usuario.nombre}</span>
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
