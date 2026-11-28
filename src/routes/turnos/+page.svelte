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
	let fraseActual = $state('');

	// ── 100 frases por horario ──
	const FRASES_MANANA = [
		'Buenos días, que este día te traiga cosas bonitas.',
		'El café de la mañana sabe mejor aquí.',
		'Arranca tu día con energía y algo rico.',
		'Hoy es un gran día para comer sano.',
		'Que tu mañana sea tan fresca como nuestras ensaladas.',
		'Despierta con sabor, despierta en Atoyac.',
		'Un buen desayuno cambia todo el día.',
		'Empieza el día con lo que te hace feliz.',
		'La vida es mejor con chilaquiles.',
		'Hoy mereces un desayuno de campeón.',
		'Cada mañana es una oportunidad nueva.',
		'El sol salió y tu desayuno te espera.',
		'Nada como un café recién hecho para empezar.',
		'Buenos días, hoy todo va a salir bien.',
		'Que tu café sea fuerte y tu día tranquilo.',
		'Arriba esos ánimos, hoy es tu día.',
		'El mejor momento del día es el desayuno.',
		'Fresco, saludable y hecho con cariño.',
		'Tu cuerpo te agradece comer bien desde temprano.',
		'Hoy todo lo bueno empieza aquí.',
	];
	const FRASES_MEDIODIA = [
		'Buen provecho, disfruta tu comida.',
		'A medio día, recarga energía.',
		'Lo mejor del día está en tu plato.',
		'Comer bien es quererte mucho.',
		'Date una pausa y disfruta cada bocado.',
		'Healthy no tiene que ser aburrido.',
		'Tu cuerpo merece lo mejor, dáselo.',
		'Mitad del día, toda la energía.',
		'Come rico, vive mejor.',
		'El mediodía perfecto tiene tu nombre.',
		'Relájate, tu comida está lista.',
		'Lo fresco siempre sabe mejor.',
		'Hecho al momento, solo para ti.',
		'Alimenta tu cuerpo, alimenta tu alma.',
		'El balance perfecto entre sabor y salud.',
		'Cada plato tiene una historia, esta es la tuya.',
		'Disfruta el momento, disfruta tu comida.',
		'Comer sano nunca fue tan rico.',
		'Tu pausa del día merece algo especial.',
		'De aquí sales con la pila recargada.',
	];
	const FRASES_TARDE = [
		'Buenas tardes, un café para cerrar bien el día.',
		'La tarde perfecta viene con un postre.',
		'Todavía hay mucho día por disfrutar.',
		'Un cappuccino para la tarde, ¿se antoja?',
		'Cierra tu día con algo dulce.',
		'Las mejores pláticas son con un café.',
		'La tarde es para consentirte.',
		'Un momento de paz con tu bebida favorita.',
		'Que tu tarde sea tan dulce como nuestros postres.',
		'Relájate, ya casi termina el día.',
		'Mereces este descanso, disfrútalo.',
		'Las tardes en Atoyac siempre son buenas.',
		'Un café y buena compañía, ¿qué más pides?',
		'El atardecer sabe mejor con un latte.',
		'Consiente a tu paladar esta tarde.',
		'Respira, relájate, disfruta.',
		'La vida es corta, come postre primero.',
		'Tu café de la tarde te lo has ganado.',
		'Qué bonito es darse un gusto.',
		'Cierra con broche de oro tu día.',
	];
	const FRASES_LUNES = [
		'Feliz lunes, esta semana va a ser increíble.',
		'Inicio de semana con toda la actitud.',
		'Lunes con energía, arrancamos fuerte.',
		'Nuevo lunes, nuevas oportunidades.',
		'Que este inicio de semana sea muy bonito.',
	];
	const FRASES_VIERNES = [
		'¡Es viernes! Te lo mereces.',
		'Viernes de antojitos, ¿qué se te antoja?',
		'Feliz viernes, ya casi es fin de semana.',
		'Viernes, el mejor día de la semana.',
		'Arranca tu fin de semana aquí.',
	];
	const FRASES_SABADO = [
		'Feliz sábado, disfruta tu día libre.',
		'Sábado para consentirte con algo rico.',
		'Fin de semana = comer sin prisas.',
		'Sábado tranquilo con buen café.',
		'El mejor plan del sábado: comer aquí.',
	];
	const FRASES_GENERAL = [
		'Gracias por visitarnos, vuelve pronto.',
		'Hecho con amor, servido con cariño.',
		'Tu lugar favorito para comer sano.',
		'Atoyac, donde lo saludable es delicioso.',
		'Cada día es una oportunidad de comer bien.',
		'Frescura que se nota en cada bocado.',
		'Cocina real, ingredientes de verdad.',
		'Tu bienestar empieza en tu plato.',
		'Comida que te hace sentir bien.',
		'Simple, fresco, delicioso.',
		'Alimentamos tu día con lo mejor.',
		'Santa Cruz Atoyac tiene sabor.',
		'Calidad en cada ingrediente.',
		'Donde lo healthy se vuelve tu favorito.',
		'Ven por uno, repite por dos.',
	];

	function obtenerFrase(): string {
		const h = new Date().getHours();
		const dia = new Date().getDay(); // 0=dom, 1=lun...
		let pool: string[];
		if (dia === 1) pool = [...FRASES_LUNES, ...(h < 12 ? FRASES_MANANA : h < 16 ? FRASES_MEDIODIA : FRASES_TARDE)];
		else if (dia === 5) pool = [...FRASES_VIERNES, ...(h < 12 ? FRASES_MANANA : h < 16 ? FRASES_MEDIODIA : FRASES_TARDE)];
		else if (dia === 6) pool = [...FRASES_SABADO, ...(h < 12 ? FRASES_MANANA : h < 16 ? FRASES_MEDIODIA : FRASES_TARDE)];
		else if (h < 12) pool = [...FRASES_MANANA, ...FRASES_GENERAL];
		else if (h < 16) pool = [...FRASES_MEDIODIA, ...FRASES_GENERAL];
		else pool = [...FRASES_TARDE, ...FRASES_GENERAL];
		return pool[Math.floor(Math.random() * pool.length)];
	}

	function activarSonido() {
		desbloquearAudio();
		sonidoActivo = true;
		campana();
	}

	async function recargar() {
		try {
			datos = await api.turnos();
		} catch {
			/* se reintenta con el siguiente evento o reconexión */
		}
	}

	let fin: ReturnType<typeof setTimeout>;
	const cola = crearCola<{ turno: number; cliente: string | null }>((item) => {
		llamado = item.turno;
		campana();
		const nombre = item.cliente ? `${item.cliente}, tu` : 'Tu';
		hablar(`${nombre} pedido número ${item.turno} está listo`);
		clearTimeout(fin);
		fin = setTimeout(() => (llamado = null), 6000);
	}, 8000);

	const stream = crearStream(
		{
			'turno.listo': (d) => cola.agregar({ turno: d.turno, cliente: d.cliente }),
			'pedido.creado': recargar,
			'pedido.actualizado': recargar
		},
		{ alAbrir: recargar }
	);

	const mostrado = $derived(llamado ?? datos.actual?.turno ?? null);

	onMount(() => {
		desbloquearAudio();
		fraseActual = obtenerFrase();
		const fraseInterval = setInterval(() => (fraseActual = obtenerFrase()), 20_000);
		stream.abrir();
		let lock: WakeLockSentinel | undefined;
		const pedirLock = () => navigator.wakeLock?.request('screen').then((l) => (lock = l)).catch(() => {});
		pedirLock();
		document.addEventListener('visibilitychange', pedirLock);
		const refresco = setInterval(recargar, 30_000);
		return () => {
			document.removeEventListener('visibilitychange', pedirLock);
			clearInterval(refresco);
			clearInterval(fraseInterval);
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
		padding: 16px 24px;
		box-shadow: 0 2px 12px rgba(0,0,0,0.08);
	}
	.llamado .qr-zona { background: rgba(255,255,255,0.15); }
	.qr-img {
		width: 240px;
		height: 240px;
		border-radius: 12px;
	}
	.qr-texto {
		font: 700 28px/1.2 var(--f-titulo);
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

	.frase {
		position: absolute;
		bottom: 12px;
		left: 40px;
		right: 200px;
		margin: 0;
		font: italic 500 18px/1.3 var(--f-titulo);
		color: var(--c-hoja);
		opacity: 0.8;
	}
	.llamado .frase { color: var(--c-menta-tv); opacity: 0.6; }

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
