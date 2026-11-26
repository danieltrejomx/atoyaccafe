<script lang="ts">
	import { onMount } from 'svelte';
	import { crearApi } from '$lib/api';
	import { crearStream } from '$lib/stream.svelte';
	import type { TurnosRespuesta } from '$lib/types';
	import { campana, crearCola, desbloquearAudio, hablar } from '$lib/turnos/anuncios';
	import VideoLoop from '$lib/turnos/VideoLoop.svelte';

	const api = crearApi();
	let datos = $state<TurnosRespuesta>({ actual: null, proximos: [], listos: [] });
	let llamado = $state<number | null>(null); // turno resaltado (listo) durante 6 s
	let activado = $state(false);
	let escala = $state(1);

	async function recargar() {
		try {
			datos = await api.turnos();
		} catch {
			/* se reintenta con el siguiente evento o reconexión */
		}
	}

	let fin: ReturnType<typeof setTimeout>;
	const cola = crearCola<number>((n) => {
		llamado = n;
		campana();
		hablar(`Turno ${n}, su pedido está listo`);
		clearTimeout(fin);
		fin = setTimeout(() => (llamado = null), 6000);
	}, 8000);

	const stream = crearStream(
		{
			'turno.listo': (d) => cola.agregar(d.turno),
			'pedido.creado': recargar,
			'pedido.actualizado': recargar
		},
		{ alAbrir: recargar }
	);

	const mostrado = $derived(llamado ?? datos.actual?.turno ?? null);
	const productos = $derived(llamado ? [] : (datos.actual?.productos ?? []));
	const lineas = $derived(productos.length > 3 ? [...productos.slice(0, 2), `+${productos.length - 2} más`] : productos);

	function activar() {
		activado = true;
		desbloquearAudio();
	}

	onMount(() => {
		const ajustar = () => (escala = Math.min(innerWidth / 1080, innerHeight / 1920));
		ajustar();
		addEventListener('resize', ajustar);
		stream.abrir();
		let lock: WakeLockSentinel | undefined;
		const pedirLock = () => navigator.wakeLock?.request('screen').then((l) => (lock = l)).catch(() => {});
		pedirLock();
		document.addEventListener('visibilitychange', pedirLock);
		const refresco = setInterval(recargar, 30_000); // red de seguridad si se perdiera un evento
		return () => {
			removeEventListener('resize', ajustar);
			document.removeEventListener('visibilitychange', pedirLock);
			clearInterval(refresco);
			clearTimeout(fin);
			stream.cerrar();
			lock?.release();
		};
	});
</script>

<svelte:head><title>Turnos | Atoyac Café</title></svelte:head>

<div class="ventana">
	<main class="tv lienzo" style:transform="translate(-50%, -50%) scale({escala})">
		<section class="banda" class:llamado={llamado !== null}>
			{#if mostrado === null}
				<div class="vacio">
					<img src="/img/logo.svg" alt="Atoyac Café" />
					<p>Bienvenido a Atoyac. Ordena en el kiosco o en caja.</p>
				</div>
			{:else}
				<div class="izq">
					<span class="etq">TURNO</span>
					{#key mostrado}
						<span class="num" class:largo={mostrado > 99} aria-live="polite">{mostrado}</span>
					{/key}
				</div>
				<ul class="centro">
					{#if llamado}
						<li class="listo">Tu pedido está listo</li>
					{:else}
						{#each lineas as l (l)}<li>{l}</li>{/each}
					{/if}
				</ul>
				<aside class="der">
					<img class="logo" src="/img/logo.svg" alt="" />
					<span class="etq chica">PRÓXIMOS</span>
					{#each datos.proximos as p (p)}<span class="prox">{p}</span>{/each}
				</aside>
			{/if}
			{#if !stream.conectado}<span class="chip">Reconectando…</span>{/if}
		</section>
		<section class="video"><VideoLoop src="/video/ensaladas.mp4" texto="Sándwiches y baguettes, hechos al momento" tono="bosque" /></section>
		<section class="video"><VideoLoop src="/video/bebidas-calientes.mp4" texto="Pide tu bebida en combo y ahorra" tono="barro" /></section>
	</main>

	{#if !activado}
		<button class="velo" onclick={activar}>Toca la pantalla para activar el sonido</button>
	{/if}
</div>

<style>
	:global(html, body) { margin: 0; overflow: hidden; background: var(--c-bosque); }
	.ventana { position: fixed; inset: 0; overflow: hidden; cursor: none; }
	.lienzo {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 1080px;
		height: 1920px;
		display: grid;
		grid-template-rows: 640px 640px 640px;
		background: var(--c-papel);
		font-family: var(--f-texto);
		color: var(--c-texto);
		transform-origin: center;
	}
	.banda {
		position: relative;
		display: grid;
		grid-template-columns: 390px 1fr 240px;
		gap: 32px;
		padding: 48px;
		background: var(--c-arena);
		transition: background var(--dur-3);
	}
	.banda.llamado { background: var(--c-bosque); color: var(--c-texto-inverso); }
	.izq { display: flex; flex-direction: column; }
	.etq {
		font: 700 var(--tv-titulo) var(--f-titulo);
		letter-spacing: var(--ls-etiqueta);
		color: var(--c-hoja);
	}
	.etq.chica { font-size: var(--tv-etiqueta); color: var(--c-bosque); letter-spacing: 0.04em; }
	.num {
		font: 700 var(--tv-numero)/0.9 var(--f-titulo);
		font-variant-numeric: tabular-nums;
		color: var(--c-hoja);
		margin-top: 16px;
		animation: entra var(--dur-4) var(--ease-rebote);
	}
	.num.largo { font-size: 220px; }
	.llamado .etq, .llamado .num, .llamado .etq.chica { color: var(--c-texto-inverso); }
	.centro {
		list-style: none;
		margin: 0;
		padding: 0 32px 0 0;
		border-right: 2px solid var(--c-linea-fuerte);
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 24px;
		font-weight: 600;
		font-size: var(--tv-texto);
		line-height: 1.15;
	}
	.centro .listo { font-family: var(--f-titulo); font-size: 56px; color: var(--c-menta-tv); }
	.llamado .centro { border-color: rgba(247, 243, 236, 0.3); }
	.der { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
	.logo { width: 96px; margin-bottom: 24px; }
	.llamado .logo, .vacio img { filter: none; }
	.llamado .logo { filter: brightness(0) invert(1); }
	.prox { font: 700 var(--tv-proximo)/1.1 var(--f-titulo); font-variant-numeric: tabular-nums; color: var(--c-hoja); }
	.llamado .prox { color: var(--c-menta-tv); }
	.vacio { grid-column: 1 / -1; display: grid; place-content: center; justify-items: center; gap: 32px; text-align: center; }
	.vacio img { width: 320px; }
	.vacio p { margin: 0; font: 600 var(--tv-texto) var(--f-titulo); max-width: 800px; }
	.chip {
		position: absolute;
		left: 24px;
		bottom: 16px;
		padding: 4px 16px;
		border-radius: var(--r-pill);
		background: var(--c-maiz-claro);
		color: var(--c-preparando);
		font: 600 var(--fs-20) var(--f-titulo);
	}
	.video { border-top: 2px solid var(--c-papel); overflow: hidden; }
	.velo {
		position: fixed;
		inset: 0;
		z-index: 10;
		border: 0;
		background: rgba(31, 45, 36, 0.92);
		color: var(--c-texto-inverso);
		font: 600 56px var(--f-titulo);
		padding: 48px;
		cursor: none;
	}
	@keyframes entra { from { transform: translateY(120px); opacity: 0; } }
	@media (prefers-reduced-motion: reduce) { .num { animation: none; } .banda { transition: none; } }
</style>
