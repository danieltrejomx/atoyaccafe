<script lang="ts">
	import { page } from '$app/state';
	import Icono from './Icono.svelte';

	const ENLACES = [
		['/', 'Inicio'],
		['/menu', 'Menú'],
		['/nosotros', 'Nosotros'],
		['/inauguracion', 'Inauguración']
	];
	let abierto = $state(false);
	const activo = (r: string) => (r === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(r));
	$effect(() => { page.url.pathname; abierto = false; });
</script>

<header>
	<div class="contenedor barra">
		<a class="marca" href="/" aria-label="Atoyac Café, inicio">
			<img src="/img/logo.svg" alt="" width="40" height="40" /><span>Atoyac</span>
		</a>
		<button class="burger" aria-expanded={abierto} aria-controls="nav" aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'} onclick={() => (abierto = !abierto)}>
			<Icono nombre={abierto ? 'cerrar' : 'menu'} tam={24} />
		</button>
		<nav id="nav" class:abierto aria-label="Principal">
			{#each ENLACES as [r, t]}
				<a href={r} aria-current={activo(r) ? 'page' : undefined}>{t}</a>
			{/each}
			<a class="btn" href="/delivery"><Icono nombre="moto" />Pedir a domicilio</a>
		</nav>
	</div>
</header>

<style>
	header { position: sticky; top: 0; z-index: var(--z-barra); background: color-mix(in srgb, var(--c-papel) 92%, transparent); backdrop-filter: blur(8px); border-bottom: 1px solid var(--c-linea); }
	.barra { display: flex; align-items: center; justify-content: space-between; min-height: 64px; }
	.marca { display: flex; align-items: center; gap: var(--sp-2); text-decoration: none; font-family: var(--f-titulo); font-weight: 700; font-size: var(--fs-20); letter-spacing: .08em; text-transform: uppercase; }
	nav { display: flex; align-items: center; gap: var(--sp-5); }
	nav a:not(.btn) { text-decoration: none; font-weight: 600; padding: var(--sp-2) 0; border-bottom: 2px solid transparent; }
	nav a[aria-current] { color: var(--c-hoja); border-bottom-color: var(--c-hoja); }
	.burger { display: none; width: var(--toque); height: var(--toque); border: 0; background: none; color: inherit; cursor: pointer; align-items: center; justify-content: center; }
	@media (max-width: 760px) {
		.burger { display: inline-flex; }
		nav { display: none; position: absolute; inset: 64px 0 auto 0; flex-direction: column; align-items: stretch; gap: 0; padding: var(--sp-3) var(--sp-4) var(--sp-5); background: var(--c-papel); border-bottom: 1px solid var(--c-linea); box-shadow: var(--sh-2); }
		nav.abierto { display: flex; }
		nav a:not(.btn) { padding: var(--sp-3) 0; min-height: var(--toque); }
	}
</style>
