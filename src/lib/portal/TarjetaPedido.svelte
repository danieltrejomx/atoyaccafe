<script lang="ts">
	import type { Pedido, PedidoItem } from '$lib/types';
	import { ETIQUETA_CANAL, SIGUIENTE, pesos, tiempo } from './acceso';

	let { pedido, ahora, puedeCobrar, accion }: {
		pedido: Pedido;
		ahora: number;
		puedeCobrar: boolean;
		accion: (tipo: 'avanzar' | 'cancelar' | 'cobrar', p: Pedido) => void;
	} = $props();

	const t = $derived(tiempo(pedido.creadoEn, ahora));
	const activo = $derived(pedido.estado !== 'entregado' && pedido.estado !== 'cancelado');
	const pendiente = $derived(pedido.pagoEstado === 'pendiente');
	const sig = $derived(SIGUIENTE[pedido.estado]);

	// --- Countdown timer ---
	const TIEMPOS: Record<string, number> = {
		'Plato de fruta': 2, 'Galleta de chocolate': 2, '5 mini donas': 2,
		'Pastel de zanahoria': 2, 'Cheesecake': 2,
		'Café del día': 2, 'Americano': 2, 'Café de olla': 2,
		'Tisana 500 ml': 2, 'Coca-Cola 355 ml': 2, 'Coca-Cola Light 355 ml': 2,
		'Agua de horchata 500 ml': 2, 'Agua de jamaica 500 ml': 2,
	};

	function tiempoPrep(items: PedidoItem[]): number {
		return Math.max(...items.map(i => TIEMPOS[i.nombre] ?? 5));
	}

	const tiempoObjetivo = $derived(tiempoPrep(pedido.items) * 60 * 1000);
	const restante = $derived(
		pedido.estado === 'preparando'
			? tiempoObjetivo - (ahora - pedido.actualizadoEn)
			: null
	);
	let yaAviso = $state(false);

	const countdownTexto = $derived.by(() => {
		if (restante === null) return null;
		if (restante <= 0) {
			// Avisar por voz una sola vez cuando se pasa del tiempo
			if (!yaAviso && typeof speechSynthesis !== 'undefined') {
				yaAviso = true;
				const productos = pedido.items.map(i => i.nombre).join(', ');
				const u = new SpeechSynthesisUtterance(`Atención, el turno ${pedido.turno} se pasó del tiempo. Apúrale con: ${productos}`);
				u.lang = 'es-MX';
				u.rate = 1;
				u.volume = 1;
				const voz = speechSynthesis.getVoices().find(v => v.lang.replace('_','-') === 'es-MX') ?? speechSynthesis.getVoices().find(v => v.lang.startsWith('es'));
				if (voz) u.voice = voz;
				speechSynthesis.speak(u);
			}
			return '\u23F0 Tiempo!';
		}
		yaAviso = false;
		const segs = Math.ceil(restante / 1000);
		const m = Math.floor(segs / 60);
		const s = segs % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	});
	const countdownPct = $derived(
		restante !== null && tiempoObjetivo > 0
			? Math.max(0, Math.min(1, 1 - restante / tiempoObjetivo))
			: 0
	);

	// --- Recetas paso a paso (super detalladas para alguien que no sabe cocinar) ---
	const RECETAS: Record<string, { categoria: string; pasos: string[] }> = {
		'Ensalada Tradicional': { categoria: 'ensalada', pasos: [
			'🥬 Lavar bien la lechuga y la espinaca con agua',
			'✂️ Picar 80g de lechuga en trozos medianos con la mano (no cuchillo)',
			'🥬 Agregar 30g de espinaca baby entera (un puño)',
			'🍅 Cortar 5 tomates cherry a la mitad con cuchillo',
			'🥕 Rallar 30g de zanahoria con el rallador grueso',
			'🥒 Cortar 40g de pepino en rodajas delgadas',
			'🥑 Cortar ¼ de aguacate en rebanadas y ponerlo encima',
			'🧀 Cortar 40g de queso panela en cubitos pequeños',
			'🫗 Poner 15g de crotones (el puñito de la bolsa) encima',
			'🫗 Espolvorear 1 cucharada de semillas de girasol',
			'🥗 Servir aparte 40ml del aderezo que pida: ranch o mil islas'
		]},
		'Ensalada Jamón de pavo': { categoria: 'ensalada', pasos: [
			'🥬 Preparar la base igual que la Ensalada Tradicional (pasos 1-10)',
			'🥩 Tomar 3 rebanadas de jamón de pavo (60g)',
			'✂️ Enrollar cada rebanada y cortarla en tiritas',
			'🍽️ Poner las tiritas de jamón repartidas encima de la ensalada',
			'🥗 Servir aparte 40ml del aderezo: ranch o mil islas'
		]},
		'Ensalada de atún': { categoria: 'ensalada', pasos: [
			'🥬 Preparar la base igual que la Ensalada Tradicional (pasos 1-10)',
			'🫗 Abrir 1 lata de atún Dolores y escurrirle todo el aceite/agua',
			'✂️ Desmenuzar el atún (100g) con un tenedor',
			'🍽️ Repartir el atún desmenuzado encima de la ensalada',
			'🥗 Servir aparte 40ml del aderezo: ranch o mil islas'
		]},
		'Ensalada de pollo': { categoria: 'ensalada', pasos: [
			'🥬 Preparar la base igual que la Ensalada Tradicional (pasos 1-10)',
			'🌶️ Sazonar 120g de pechuga de pollo con sal y pimienta',
			'🍳 Cocinar en la plancha a fuego medio-alto ~4 min por lado hasta dorar',
			'✂️ Dejar reposar 1 minuto y cortar en tiras gruesas',
			'🍗 Poner las tiras de pollo encima de la ensalada',
			'🥗 Servir aparte 40ml del aderezo: ranch o mil islas'
		]},
		'Ensalada de res': { categoria: 'ensalada', pasos: [
			'🥬 Preparar la base igual que la Ensalada Tradicional (pasos 1-10)',
			'🌶️ Sazonar 120g de fajitas de res con sal y pimienta',
			'🍳 Cocinar en la plancha a fuego alto ~3 min por lado',
			'✂️ Cortar en tiras delgadas',
			'🥩 Poner las fajitas encima de la ensalada',
			'🥗 Servir aparte 40ml del aderezo: ranch o mil islas'
		]},
		'Chilaquiles sencillos': { categoria: 'chilaquiles', pasos: [
			'🌶️ Calentar 1 taza (250ml) de salsa verde en un sartén a fuego medio',
			'🔥 Cuando empiece a hervir, agregar 100g de totopos (se ponen de ambos lados)',
			'🫗 Mezclar bien con una cuchara de madera para que se bañen de salsa (~1 min)',
			'🍽️ Pasar los chilaquiles al plato',
			'🫗 Poner encima 2 cucharadas de crema con una cuchara',
			'🧀 Espolvorear 30g de queso fresco desmoronado',
			'✂️ Picar 15g de cebolla en rodajas delgadas y ponerla encima',
			'🥑 Cortar ¼ de aguacate en rebanadas y acomodar al lado',
			'🥬 Poner una ramita de epazote fresco como decoración',
			'🫘 Servir siempre con 100g de frijoles refritos al lado en el mismo plato'
		]},
		'Chilaquiles con pollo': { categoria: 'chilaquiles', pasos: [
			'🌶️ Preparar los chilaquiles igual que los sencillos (pasos 1-9)',
			'🍳 Cocinar 100g de pollo en la plancha si no está listo',
			'✂️ Cortar el pollo en tiras o cubos',
			'🍗 Poner el pollo HASTA ARRIBA de los chilaquiles (lo último)',
			'🫘 Servir con 100g de frijoles refritos al lado'
		]},
		'Chilaquiles con res': { categoria: 'chilaquiles', pasos: [
			'🌶️ Preparar los chilaquiles igual que los sencillos (pasos 1-9)',
			'🍳 Cocinar 100g de fajitas de res en la plancha a fuego alto',
			'✂️ Cortar en tiras',
			'🥩 Poner la res HASTA ARRIBA de los chilaquiles (lo último)',
			'🫘 Servir con 100g de frijoles refritos al lado'
		]},
		'Molletes sencillos': { categoria: 'molletes', pasos: [
			'🥖 Tomar 2 bolillos y cortar cada uno a la mitad con cuchillo de sierra',
			'🍳 Poner las 4 mitades en la plancha o comal, con la parte cortada hacia abajo',
			'⏱️ Calentar 2 minutos hasta que estén crujientes',
			'🫘 Voltear y untar 40g de frijoles refritos en cada mitad con cuchara',
			'🧀 Poner encima 1 rebanada de queso manchego en cada una',
			'🔥 Meter al horno o salamandra hasta que el queso se derrita y gratine',
			'🍽️ Sacar y servir en plato',
			'🍅 Poner 60g de pico de gallo al lado como complemento'
		]},
		'Molletes Atoyac': { categoria: 'molletes', pasos: [
			'🥖 Tomar 2 bolillos y cortar cada uno a la mitad con cuchillo de sierra',
			'🍳 Poner las 4 mitades en la plancha, parte cortada hacia abajo, 2 minutos',
			'🫘 Voltear y untar 40g de frijoles refritos en cada mitad',
			'🥩 Dorar 2 tiras de tocino en la plancha hasta que estén crujientes',
			'🍗 Poner 60g de pollo desmenuzado sobre los frijoles',
			'🥩 Poner las tiras de tocino dorado encima del pollo',
			'🧀 Cubrir con 1 rebanada de queso manchego en cada mitad',
			'🔥 Meter al horno hasta que gratine el queso',
			'🍅 Servir con 60g de pico de gallo al lado'
		]},
		'Chapata jamón de pavo': { categoria: 'chapata', pasos: [
			'❓ PREGUNTAR al cliente: ¿pan normal o integral? ¿quiere mayonesa?',
			'🥖 Tomar el pan chapata y abrirlo por la mitad con cuchillo de sierra',
			'🍳 Poner ambas mitades en la plancha para calentar ~1 min',
			'🧈 Si pidió mayonesa: untar 1 cucharada en la parte de abajo del pan',
			'🥩 Poner 4 rebanadas de jamón de pavo (80g) dobladas sobre el pan',
			'✂️ Cortar cebolla en aros delgados y poner encima del jamón',
			'🧀 Poner 1 rebanada de panela (40g) y 1 de manchego',
			'🥬 Colocar 2 hojas de lechuga lavadas',
			'🍅 Cortar 3 rodajas de tomate y ponerlas',
			'🥖 Cerrar el pan con la otra mitad',
			'🥔 Freír 120g de papas fritas y servir al lado'
		]},
		'Chapata de pollo': { categoria: 'chapata', pasos: [
			'❓ PREGUNTAR al cliente: ¿pan normal o integral? ¿quiere mayonesa?',
			'🥖 Abrir el pan chapata y calentarlo en la plancha ~1 min',
			'🧈 Si pidió mayonesa: untar 1 cucharada en la parte de abajo',
			'✂️ Cortar pimiento verde y rojo en tiritas, cebolla en aros',
			'🍗 Cocinar 120g de pollo a la plancha con los pimientos y cebolla',
			'🔥 Caramelizar la cebolla (dejar que se dore bien, ~3 min)',
			'🍽️ Poner el pollo con verduras sobre el pan',
			'🧀 Agregar 1 rebanada de panela (40g) y 1 de manchego',
			'🥬 Colocar 2 hojas de lechuga y 3 rodajas de tomate',
			'🥖 Cerrar el pan',
			'🥔 Freír 120g de papas fritas y servir al lado',
			'🥗 Si pide ensalada en vez de papas: lechuga, tomate, zanahoria, pepino y aguacate'
		]},
		'Chapata fajitas de res': { categoria: 'chapata', pasos: [
			'❓ PREGUNTAR al cliente: ¿pan normal o integral? ¿quiere mayonesa?',
			'🥖 Abrir el pan chapata y calentarlo en la plancha ~1 min',
			'🧈 Si pidió mayonesa: untar 1 cucharada en la parte de abajo',
			'✂️ Cortar pimiento verde y rojo en tiritas, cebolla en aros',
			'🥩 Cocinar 120g de fajitas de res en la plancha a fuego alto con los pimientos y cebolla',
			'🔥 Caramelizar la cebolla (dejar que se dore bien, ~3 min)',
			'🍽️ Poner las fajitas con verduras sobre el pan',
			'🧀 Agregar 1 rebanada de panela (40g) y 1 de manchego',
			'🥬 Colocar 2 hojas de lechuga y 3 rodajas de tomate',
			'🥖 Cerrar el pan',
			'🥔 Freír 120g de papas fritas y servir al lado',
			'🥗 Si pide ensalada en vez de papas: lechuga, tomate, zanahoria, pepino y aguacate'
		]},
		'Plato de fruta': { categoria: 'postre', pasos: [
			'🍎 Lavar bien 1 manzana chica con agua',
			'✂️ Cortar la manzana en cubitos pequeños (quitar el corazón con semillas)',
			'🍌 Pelar 1 plátano y cortarlo en rodajas redondas',
			'⏱️ Total entre manzana y plátano debe ser 200g',
			'🥣 Poner la fruta en un plato hondo o bowl',
			'🥣 Agregar 100g de yogurt natural encima de la fruta',
			'🫗 Poner 2 cucharadas de granola sobre el yogurt',
			'🍯 Terminar con 1 cucharadita de miel de abeja por encima'
		]},
	};

	// --- Fotos de productos ---
	const FOTOS: Record<string, string> = {
		'Ensalada Tradicional': '/img/dishes/ensalada-tradicional.jpg',
		'Ensalada Jamón de pavo': '/img/dishes/ensalada-jamon.jpg',
		'Ensalada de atún': '/img/dishes/ensalada-atun.jpg',
		'Ensalada de pollo': '/img/dishes/ensalada-pollo.jpg',
		'Ensalada de res': '/img/dishes/ensalada-res.jpg',
		'Chilaquiles sencillos': '/img/dishes/chilaquiles-sencillos.jpg',
		'Chilaquiles con pollo': '/img/dishes/chilaquiles-pollo.jpg',
		'Chilaquiles con res': '/img/dishes/chilaquiles-res.jpg',
		'Molletes sencillos': '/img/dishes/molletes-sencillos.jpg',
		'Molletes Atoyac': '/img/dishes/molletes-atoyac.jpg',
		'Chapata jamón de pavo': '/img/dishes/chapata-jamon.jpg',
		'Chapata de pollo': '/img/dishes/chapata-pollo.jpg',
		'Chapata fajitas de res': '/img/dishes/chapata-res.jpg',
		'Plato de fruta': '/img/dishes/fruta.jpg',
		'Galleta de chocolate': '/img/dishes/galleta-chocolate.jpg',
		'5 mini donas': '/img/dishes/mini-donas.jpg',
		'Pastel de zanahoria': '/img/dishes/pastel-zanahoria.jpg',
		'Cheesecake': '/img/dishes/cheesecake.jpg',
		'Café del día': '/img/dishes/cafe.jpg',
		'Americano': '/img/dishes/cafe.jpg',
		'Café de olla': '/img/dishes/cafe.jpg',
		'Espresso': '/img/dishes/cafe.jpg',
		'Latte': '/img/dishes/cafe.jpg',
		'Cappuccino': '/img/dishes/cafe.jpg',
	};

	// --- Emojis para opciones ---
	function opcionConEmoji(nombre: string): string {
		if (nombre.toLowerCase().includes('pan:') || nombre === 'Normal' || nombre === 'Integral') return `🥖 ${nombre}`;
		if (nombre.toLowerCase().includes('aderezo')) return `🥗 ${nombre}`;
		if (nombre.toLowerCase().includes('papas') || nombre.toLowerCase().includes('acompañamiento')) return `🍟 ${nombre}`;
		return nombre;
	}

	// --- Badge de pan para chapatas ---
	function panBadge(it: PedidoItem): string | null {
		if (!it.nombre.includes('Chapata')) return null;
		for (const op of it.opciones) {
			if (op.nombre === 'Normal' || op.nombre === 'Integral' || op.nombre.includes('Pan: Normal') || op.nombre.includes('Pan: Integral')) {
				return op.nombre.includes('Integral') || op.nombre === 'Integral' ? 'Integral' : 'Normal';
			}
		}
		return null;
	}

	let tooltipItem = $state<string | null>(null);
</script>

<article class="tarjeta {activo ? t.tono : ''}" style="--canal: var(--c-canal-{pedido.canal})">
	{#if pendiente && pedido.estado !== 'cancelado'}
		<p class="pend">Pendiente de pago{pedido.pagoMetodo ? ` · ${pedido.pagoMetodo}` : ''}</p>
	{/if}
	<header>
		<span class="etiqueta canal">{ETIQUETA_CANAL[pedido.canal]}</span>
		<span class="chip {pedido.estado}">{pedido.estado}</span>
	</header>
	<div class="cab">
		<span class="turno" aria-label="Turno {pedido.turno}">{pedido.turno}</span>
		<div class="cab-der">
			{#if countdownTexto !== null}
				<span class="countdown" class:vencido={restante !== null && restante <= 0}>
					<span class="countdown-txt">{countdownTexto}</span>
				</span>
			{/if}
			<span class="tiempo">{t.texto}</span>
		</div>
	</div>
	<ul>
		{#each pedido.items as it (it.id)}
			<li>
				{#if FOTOS[it.nombre]}
					<img class="item-foto" src={FOTOS[it.nombre]} alt={it.nombre} />
				{:else}
					<span class="item-foto-placeholder"></span>
				{/if}
				<b>{it.cantidad}</b>
				<span class="item-wrap">
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<span
						class="nombre-prod"
						class:tiene-receta={!!RECETAS[it.nombre]}
						onmouseenter={() => { if (RECETAS[it.nombre]) tooltipItem = it.nombre; }}
						onmouseleave={() => { tooltipItem = null; }}
					>
						{it.nombre}
						{#if panBadge(it)}
							<span class="pan-badge">🥖 {panBadge(it)}</span>
						{/if}
						{#if tooltipItem === it.nombre && RECETAS[it.nombre]}
							<div class="receta-panel {RECETAS[it.nombre].categoria}">
								<div class="receta-head">
									{#if FOTOS[it.nombre]}<img class="receta-foto" src={FOTOS[it.nombre]} alt="" />{/if}
									<strong>{it.nombre}</strong>
								</div>
								<ol class="receta-pasos">
									{#each RECETAS[it.nombre].pasos as paso, i}
										<li>{paso}</li>
									{/each}
								</ol>
							</div>
						{/if}
					</span>
					{#if it.opciones.length}<span class="op">{it.opciones.map((o) => opcionConEmoji(o.nombre)).join(' · ')}</span>{/if}
					{#if it.notas}{#if it.notas.includes('Sin')}<span class="op modificacion">{it.notas}</span>{:else}<span class="op">{it.notas}</span>{/if}{/if}
				</span>
			</li>
		{/each}
	</ul>
	{#if pedido.notas}<p class="nota">Nota: {pedido.notas}</p>{/if}
	<footer>
		<span class="cliente">{[pedido.cliente, pedido.externoId && `#${pedido.externoId}`].filter(Boolean).join(' · ')}</span>
		<span class="total">{pesos(pedido.total)}</span>
	</footer>
	{#if activo}
		<div class="acciones">
			{#if pendiente}
				{#if puedeCobrar}<button class="btn pago" onclick={() => accion('cobrar', pedido)}>Cobrar {pesos(pedido.total)}</button>{/if}
			{:else if sig}
				<button class="btn" class:sec={pedido.estado === 'listo'} onclick={() => accion('avanzar', pedido)}>{sig.texto}</button>
			{/if}
			<button class="btn quieto cancelar" onclick={() => accion('cancelar', pedido)}>Cancelar pedido</button>
		</div>
	{/if}
	{#if restante !== null}
		<div class="timer-bar-wrap">
			<div
				class="timer-bar"
				class:warn={restante !== null && restante < 60000 && restante > 0}
				class:expired={restante !== null && restante <= 0}
				style:width="{Math.max(0, (1 - countdownPct)) * 100}%"
			></div>
		</div>
	{/if}
</article>

<style>
	.tarjeta { background: var(--c-blanco); border-radius: var(--r-md); box-shadow: var(--sh-1); border-left: 8px solid var(--canal); padding: var(--sp-4); display: grid; gap: var(--sp-3); align-content: start; overflow: hidden; animation: llega var(--dur-3) var(--ease-salida); }
	@keyframes llega { from { opacity: 0; transform: translateY(-12px); } }
	header, footer, .cab { display: flex; justify-content: space-between; align-items: center; gap: var(--sp-2); }
	.cab { align-items: baseline; }
	.cab-der { display: flex; align-items: center; gap: var(--sp-3); }
	.canal { color: var(--canal) !important; font-size: var(--fs-14) !important; }
	.turno { font: 700 var(--fs-56)/1 var(--f-titulo); font-variant-numeric: tabular-nums; }
	ul { list-style: none; margin: 0; padding: var(--sp-3) 0; display: grid; gap: var(--sp-2); border-block: 1px solid var(--c-linea); }
	li { display: grid; grid-template-columns: 44px 24px 1fr; gap: var(--sp-2); align-items: start; }
	.item-foto { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid var(--c-linea); }
	.item-foto-placeholder { width: 40px; height: 40px; border-radius: 50%; background: var(--c-linea); opacity: 0.3; }
	li b { font-family: var(--f-titulo); font-variant-numeric: tabular-nums; }
	.item-wrap { display: inline; }
	.op { display: block; font-size: var(--fs-14); color: var(--c-texto-suave); }
	.nota { margin: 0; padding: var(--sp-2) var(--sp-3); border-radius: var(--r-sm); background: var(--c-maiz-claro); font-size: var(--fs-14); }
	.cliente { font-size: var(--fs-14); color: var(--c-texto-suave); overflow-wrap: anywhere; }
	.tiempo { font-size: var(--fs-14); color: var(--c-texto-suave); font-variant-numeric: tabular-nums; }
	.ambar .tiempo { color: var(--c-preparando); font-weight: 600; }
	.rojo .tiempo { color: var(--c-peligro); font-weight: 700; }
	.total { font: 600 var(--fs-20) var(--f-titulo); font-variant-numeric: tabular-nums; }
	.pend { margin: calc(-1 * var(--sp-4)) calc(-1 * var(--sp-4)) 0; padding: var(--sp-2) var(--sp-4); background: var(--c-maiz-claro); color: var(--c-preparando); font: 600 var(--fs-14) var(--f-titulo); }
	.acciones { display: flex; gap: var(--sp-2); flex-wrap: wrap; align-items: center; justify-content: space-between; }
	.cancelar { color: var(--c-cancelado) !important; padding-inline: var(--sp-2) !important; font-size: var(--fs-14) !important; }

	/* Countdown timer */
	.countdown { display: inline-flex; align-items: center; gap: var(--sp-1); font-variant-numeric: tabular-nums; font-weight: 700; font-size: var(--fs-16); color: var(--c-hoja-fuerte); }
	.countdown.vencido { color: var(--c-peligro); animation: pulso-timer 1s infinite alternate; }
	.countdown-txt { min-width: 3ch; }
	@keyframes pulso-timer { from { opacity: 1; } to { opacity: 0.5; } }

	/* Barra tipo semáforo */
	.timer-bar-wrap {
		margin: 0 calc(-1 * var(--sp-4)) calc(-1 * var(--sp-4));
		height: 12px;
		background: var(--c-linea);
		border-radius: 0 0 var(--r-md) var(--r-md);
		overflow: hidden;
	}
	.timer-bar {
		height: 100%;
		border-radius: 0 6px 6px 0;
		transition: width 1s linear, background 2s ease;
		background: linear-gradient(90deg, #2ecc40, #8bc34a, #ffcc00, #ff9800, #e74c3c);
		background-size: 200% 100%;
	}
	.timer-bar.warn {
		background: linear-gradient(90deg, #ff9800, #e74c3c);
		background-size: 100% 100%;
	}
	.timer-bar.expired {
		background: #e74c3c;
		animation: pulso-timer 0.8s infinite alternate;
		width: 100% !important;
	}

	/* Receta panel grande */
	.nombre-prod { position: relative; }
	.tiene-receta { text-decoration: underline dotted var(--c-texto-suave); text-underline-offset: 3px; cursor: help; }
	.receta-panel {
		position: fixed;
		top: 80px;
		right: 24px;
		z-index: 100;
		width: 420px;
		max-height: calc(100vh - 120px);
		overflow-y: auto;
		background: #fff;
		border-radius: 16px;
		box-shadow: 0 12px 48px rgba(0,0,0,0.2);
		pointer-events: none;
	}
	.receta-head {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 20px 24px;
		color: #fff;
		font-size: 20px;
		font-family: var(--f-titulo);
		border-radius: 16px 16px 0 0;
		background: var(--c-hoja-fuerte, #2d6a4f);
	}
	.receta-panel.ensalada .receta-head { background: #2d6a4f; }
	.receta-panel.chilaquiles .receta-head { background: #c2410c; }
	.receta-panel.molletes .receta-head { background: #92400e; }
	.receta-panel.chapata .receta-head { background: #7c3aed; }
	.receta-panel.postre .receta-head { background: #be185d; }
	.receta-panel.fruta .receta-head { background: #16a34a; }
	.receta-foto {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid rgba(255,255,255,0.4);
		flex-shrink: 0;
	}
	.receta-pasos {
		list-style: none;
		margin: 0;
		padding: 16px 0;
		counter-reset: paso;
	}
	.receta-pasos li {
		counter-increment: paso;
		display: flex;
		gap: 14px;
		align-items: flex-start;
		padding: 10px 24px;
		font-size: 16px;
		line-height: 1.5;
		color: #333;
		border-bottom: 1px solid #f0f0f0;
	}
	.receta-pasos li:last-child { border-bottom: none; }
	.receta-pasos li::before {
		content: counter(paso);
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 32px;
		height: 32px;
		border-radius: 50%;
		background: #f0ebe0;
		color: #4a5d23;
		font-weight: 700;
		font-size: 14px;
		flex-shrink: 0;
	}

	/* Customer modifications */
	.modificacion { color: var(--c-cancelado) !important; font-weight: 600; }

	/* Pan badge for chapatas */
	.pan-badge {
		display: inline-block; margin-left: var(--sp-1); padding: 1px 6px; border-radius: var(--r-sm);
		background: var(--c-maiz-claro, #fef3c7); font-size: var(--fs-12, 12px); font-weight: 600;
		vertical-align: middle;
	}
</style>
