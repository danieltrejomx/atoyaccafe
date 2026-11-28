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
		const frase = obtenerFrase();
		hablar(`${nombre} pedido número ${item.turno} está listo. ${frase}`);
		fraseActual = frase;
		clearTimeout(fin);
		fin = setTimeout(() => (llamado = null), 8000);
	}, 12000);

	const stream = crearStream(
		{
			'turno.listo': (d) => cola.agregar({ turno: d.turno, cliente: d.cliente }),
			'pedido.creado': recargar,
			'pedido.actualizado': recargar
		},
		{ alAbrir: recargar }
	);

	onMount(() => {
		desbloquearAudio();
		fraseActual = obtenerFrase();
		const fraseInterval = setInterval(() => (fraseActual = obtenerFrase()), 20_000);
		const fraseVozInterval = setInterval(() => {
			const frase = obtenerFrase();
			fraseActual = frase;
			hablar(frase);
		}, 20 * 60_000);
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
			clearInterval(fraseVozInterval);
			clearTimeout(fin);
			stream.cerrar();
			lock?.release();
		};
	});
</script>

<svelte:head><title>Turnos | Atoyac Café</title></svelte:head>

<div class="ventana">
	<main class="tv">
		<!-- Video fullscreen -->
		<video src="/video/menu.mp4" muted loop autoplay playsinline></video>

		<!-- Frase motivadora flotante -->
		{#if fraseActual && !llamado}
			<p class="frase-flotante">{fraseActual}</p>
		{/if}

		<!-- Overlay de turno cuando se llama -->
		{#if llamado !== null}
			<div class="overlay-turno">
				<div class="overlay-contenido">
					<span class="ov-etq">TURNO</span>
					{#key llamado}
						<span class="ov-num">{llamado}</span>
					{/key}
					<span class="ov-listo">Tu pedido está listo</span>
					{#if fraseActual}<p class="ov-frase">{fraseActual}</p>{/if}
				</div>
			</div>
		{/if}

		{#if !stream.conectado}<span class="chip">Reconectando…</span>{/if}
		{#if !sonidoActivo}<button class="btn-sonido" onclick={activarSonido}>Activar sonido</button>{/if}
	</main>
</div>

<style>
	:global(html, body) { margin: 0; overflow: hidden; background: #000; }
	.ventana { position: fixed; inset: 0; overflow: hidden; cursor: none; }
	.tv {
		width: 100vh;
		height: 100vw;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%) rotate(90deg);
		transform-origin: center center;
		background: #000;
		font-family: var(--f-texto);
		color: var(--c-texto);
	}

	/* === VIDEO FULLSCREEN === */
	video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	/* === FRASE FLOTANTE (abajo, sobre el video) === */
	.frase-flotante {
		position: absolute;
		bottom: 24px;
		left: 32px;
		right: 32px;
		margin: 0;
		text-align: center;
		font: italic 600 24px/1.3 var(--f-titulo);
		color: #fff;
		text-shadow: 0 2px 12px rgba(0,0,0,0.7);
		z-index: 2;
		animation: fadeUp 0.6s ease-out;
	}
	@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

	/* === OVERLAY TURNO (animación grande sobre el video) === */
	.overlay-turno {
		position: absolute;
		inset: 0;
		background: rgba(31, 45, 36, 0.88);
		display: grid;
		place-items: center;
		z-index: 10;
		animation: overlayIn 0.4s ease-out;
	}
	@keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

	.overlay-contenido {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		text-align: center;
	}

	.ov-etq {
		font: 700 40px var(--f-titulo);
		letter-spacing: 0.12em;
		color: rgba(255,255,255,0.7);
		text-transform: uppercase;
	}
	.ov-num {
		font: 700 280px/0.9 var(--f-titulo);
		font-variant-numeric: tabular-nums;
		color: #fff;
		animation: numEntra 0.5s var(--ease-rebote);
	}
	@keyframes numEntra { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }

	.ov-listo {
		font: 700 48px var(--f-titulo);
		color: var(--c-menta-tv, #6ee7a0);
		animation: parpadeo 1s ease-in-out infinite alternate;
	}
	.ov-frase {
		margin: 24px 0 0;
		max-width: 80%;
		font: italic 500 28px/1.3 var(--f-titulo);
		color: rgba(255,255,255,0.7);
	}

	/* === UTILIDADES === */
	.chip {
		position: absolute;
		left: 16px;
		bottom: 8px;
		padding: 4px 12px;
		border-radius: var(--r-pill);
		background: var(--c-maiz-claro);
		color: var(--c-preparando);
		font: 600 14px var(--f-titulo);
		z-index: 20;
	}

	.btn-sonido {
		position: absolute;
		left: 24px;
		top: 24px;
		padding: 10px 24px;
		border: 0;
		border-radius: 24px;
		background: rgba(31, 45, 36, 0.8);
		color: #fff;
		font: 600 18px var(--f-titulo);
		cursor: pointer;
		z-index: 20;
		animation: parpadeo 1.5s ease-in-out infinite alternate;
	}

	@keyframes parpadeo { from { opacity: 1; } to { opacity: 0.4; } }
	@media (prefers-reduced-motion: reduce) { .ov-num, .overlay-turno, .frase-flotante { animation: none; } .ov-listo { animation: none; } }
</style>
