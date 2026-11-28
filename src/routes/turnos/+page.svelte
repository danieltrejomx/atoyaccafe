<script lang="ts">
	import { onMount } from 'svelte';
	import { crearApi } from '$lib/api';
	import { crearStream } from '$lib/stream.svelte';
	import type { TurnosRespuesta } from '$lib/types';
	import { campana, crearCola, desbloquearAudio, hablar } from '$lib/turnos/anuncios';

	const api = crearApi();
	let datos = $state<TurnosRespuesta>({ actual: null, proximos: [], listos: [] });
	let llamado = $state<number | null>(null);
	let sonidoActivo = $state(false);

	function activarSonido() {
		desbloquearAudio();
		sonidoActivo = true;
		campana(); // test beep
	}

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

	onMount(() => {
		desbloquearAudio();
		stream.abrir();
		let lock: WakeLockSentinel | undefined;
		const pedirLock = () => navigator.wakeLock?.request('screen').then((l) => (lock = l)).catch(() => {});
		pedirLock();
		document.addEventListener('visibilitychange', pedirLock);
		const refresco = setInterval(recargar, 30_000);
		return () => {
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
	<main class="tv">
		<!-- ARRIBA 20%: Turnos + QR -->
		<section class="banda" class:llamado={llamado !== null}>
			<div class="turno-info">
				{#if mostrado === null}
					<div class="sin-turno">
						<img class="logo-chico" src="/img/logo.svg" alt="Atoyac Café" />
						<p>Bienvenido a Atoyac</p>
					</div>
				{:else}
					<span class="etq">TURNO</span>
					{#key mostrado}
						<span class="num" aria-live="polite">{mostrado}</span>
					{/key}
					{#if llamado}
						<span class="listo-txt">¡Tu pedido está listo!</span>
					{/if}
				{/if}
			</div>

			{#if datos.proximos.length > 0}
				<div class="proximos">
					<span class="etq-chica">PRÓXIMOS</span>
					<div class="prox-lista">
						{#each datos.proximos as p (p)}<span class="prox">{p}</span>{/each}
					</div>
				</div>
			{/if}

			<div class="qr-zona">
				<img class="qr-img" src="/img/qr-kiosco.svg" alt="QR para ordenar" />
				<span class="qr-texto">Ordena desde<br/>tu cel</span>
			</div>

			{#if !stream.conectado}<span class="chip">Reconectando…</span>{/if}
			{#if !sonidoActivo}<button class="btn-sonido" onclick={activarSonido}>Activar sonido</button>{/if}
		</section>

		<!-- ABAJO 80%: Video del menú -->
		<section class="video-zona">
			<video src="/video/menu.mp4" muted loop autoplay playsinline></video>
		</section>
	</main>


</div>

<style>
	:global(html, body) { margin: 0; overflow: hidden; background: #1f2d24; }
	.ventana { position: fixed; inset: 0; overflow: hidden; cursor: none; }
	/* Rotar 90° para TV vertical que solo muestra horizontal */
	.tv {
		width: 100vh;
		height: 100vw;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%) rotate(90deg);
		transform-origin: center center;
		display: grid;
		grid-template-rows: 20% 80%;
		background: var(--c-papel);
		font-family: var(--f-texto);
		color: var(--c-texto);
	}

	/* === BANDA SUPERIOR (20%) === */
	.banda {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 24px 40px;
		background: var(--c-arena);
		transition: background var(--dur-3);
		overflow: hidden;
	}
	.banda.llamado { background: var(--c-bosque); color: var(--c-texto-inverso); }

	.turno-info {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 4px;
		flex: 1;
	}
	.sin-turno {
		display: flex;
		align-items: center;
		gap: 20px;
	}
	.logo-chico { width: 80px; }
	.sin-turno p { margin: 0; font: 600 32px var(--f-titulo); }

	.etq {
		font: 700 24px var(--f-titulo);
		letter-spacing: var(--ls-etiqueta);
		color: var(--c-hoja);
		text-transform: uppercase;
	}
	.num {
		font: 700 120px/0.9 var(--f-titulo);
		font-variant-numeric: tabular-nums;
		color: var(--c-hoja);
		animation: entra var(--dur-4) var(--ease-rebote);
	}
	.listo-txt {
		font: 700 28px var(--f-titulo);
		color: var(--c-menta-tv);
		animation: parpadeo 1s ease-in-out infinite alternate;
	}
	.llamado .etq, .llamado .num { color: var(--c-texto-inverso); }
	.llamado .listo-txt { color: var(--c-menta-tv); }

	.proximos {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}
	.etq-chica {
		font: 700 16px var(--f-titulo);
		letter-spacing: 0.06em;
		color: var(--c-bosque);
	}
	.llamado .etq-chica { color: var(--c-texto-inverso); opacity: 0.7; }
	.prox-lista { display: flex; gap: 12px; }
	.prox {
		font: 700 40px/1 var(--f-titulo);
		font-variant-numeric: tabular-nums;
		color: var(--c-hoja);
		background: rgba(255,255,255,0.5);
		border-radius: 12px;
		padding: 8px 16px;
	}
	.llamado .prox { color: var(--c-menta-tv); background: rgba(255,255,255,0.1); }

	.qr-zona {
		display: flex;
		align-items: center;
		gap: 16px;
		background: var(--c-blanco, #fff);
		border-radius: 16px;
		padding: 12px 20px;
		box-shadow: 0 2px 12px rgba(0,0,0,0.08);
	}
	.llamado .qr-zona { background: rgba(255,255,255,0.15); }
	.qr-img {
		width: 100px;
		height: 100px;
		border-radius: 8px;
	}
	.qr-texto {
		font: 700 22px/1.2 var(--f-titulo);
		color: var(--c-bosque);
		text-align: center;
	}
	.llamado .qr-texto { color: var(--c-texto-inverso); }

	.chip {
		position: absolute;
		left: 16px;
		bottom: 8px;
		padding: 4px 12px;
		border-radius: var(--r-pill);
		background: var(--c-maiz-claro);
		color: var(--c-preparando);
		font: 600 14px var(--f-titulo);
	}

	/* === VIDEO (80%) === */
	.video-zona {
		overflow: hidden;
		background: #000;
	}
	.video-zona video {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.btn-sonido {
		position: absolute;
		right: 16px;
		bottom: 8px;
		padding: 8px 20px;
		border: 0;
		border-radius: 20px;
		background: var(--c-bosque);
		color: var(--c-texto-inverso);
		font: 600 16px var(--f-titulo);
		cursor: pointer;
		z-index: 2;
		animation: parpadeo 1.5s ease-in-out infinite alternate;
	}

	@keyframes entra { from { transform: translateY(40px); opacity: 0; } }
	@keyframes parpadeo { from { opacity: 1; } to { opacity: 0.4; } }
	@media (prefers-reduced-motion: reduce) { .num { animation: none; } .banda { transition: none; } .listo-txt { animation: none; } }
</style>
