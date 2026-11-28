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
	const countdownTexto = $derived.by(() => {
		if (restante === null) return null;
		if (restante <= 0) return '\u23F0 Tiempo!';
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
	const RECETAS: Record<string, string[]> = {
		'Ensalada Tradicional': [
			'Lavar bien la lechuga y la espinaca con agua',
			'Picar 80g de lechuga en trozos medianos con la mano (no cuchillo)',
			'Agregar 30g de espinaca baby entera (un puño)',
			'Cortar 5 tomates cherry a la mitad con cuchillo',
			'Rallar 30g de zanahoria con el rallador grueso',
			'Cortar 40g de pepino en rodajas delgadas',
			'Cortar ¼ de aguacate en rebanadas y ponerlo encima',
			'Cortar 40g de queso panela en cubitos pequeños',
			'Poner 15g de crotones (el puñito de la bolsa) encima',
			'Espolvorear 1 cucharada de semillas de girasol',
			'Servir aparte 40ml del aderezo que pida: ranch o mil islas'
		],
		'Ensalada Jamón de pavo': [
			'Preparar la base igual que la Ensalada Tradicional (pasos 1-10)',
			'Tomar 3 rebanadas de jamón de pavo (60g)',
			'Enrollar cada rebanada y cortarla en tiritas',
			'Poner las tiritas de jamón repartidas encima de la ensalada',
			'Servir aparte 40ml del aderezo: ranch o mil islas'
		],
		'Ensalada de atún': [
			'Preparar la base igual que la Ensalada Tradicional (pasos 1-10)',
			'Abrir 1 lata de atún Dolores y escurrirle todo el aceite/agua',
			'Desmenuzar el atún (100g) con un tenedor',
			'Repartir el atún desmenuzado encima de la ensalada',
			'Servir aparte 40ml del aderezo: ranch o mil islas'
		],
		'Ensalada de pollo': [
			'Preparar la base igual que la Ensalada Tradicional (pasos 1-10)',
			'Sazonar 120g de pechuga de pollo con sal y pimienta',
			'Cocinar en la plancha a fuego medio-alto ~4 min por lado hasta dorar',
			'Dejar reposar 1 minuto y cortar en tiras gruesas',
			'Poner las tiras de pollo encima de la ensalada',
			'Servir aparte 40ml del aderezo: ranch o mil islas'
		],
		'Ensalada de res': [
			'Preparar la base igual que la Ensalada Tradicional (pasos 1-10)',
			'Sazonar 120g de fajitas de res con sal y pimienta',
			'Cocinar en la plancha a fuego alto ~3 min por lado',
			'Cortar en tiras delgadas',
			'Poner las fajitas encima de la ensalada',
			'Servir aparte 40ml del aderezo: ranch o mil islas'
		],
		'Chilaquiles sencillos': [
			'Calentar 1 taza (250ml) de salsa verde en un sartén a fuego medio',
			'Cuando empiece a hervir, agregar 120g de totopos',
			'Mezclar bien con una cuchara de madera para que se bañen de salsa (~1 min)',
			'Pasar los chilaquiles al plato',
			'Poner encima 2 cucharadas de crema con una cuchara',
			'Espolvorear 30g de queso fresco desmoronado',
			'Picar 15g de cebolla en rodajas delgadas y ponerla encima',
			'Cortar ¼ de aguacate en rebanadas y acomodar al lado',
			'Poner una ramita de epazote fresco como decoración',
			'Servir siempre con 100g de frijoles refritos al lado en el mismo plato'
		],
		'Chilaquiles con pollo': [
			'Preparar los chilaquiles igual que los sencillos (pasos 1-9)',
			'Cocinar 100g de pollo en la plancha si no está listo',
			'Cortar el pollo en tiras o cubos',
			'Poner el pollo HASTA ARRIBA de los chilaquiles (lo último)',
			'Servir con 100g de frijoles refritos al lado'
		],
		'Chilaquiles con res': [
			'Preparar los chilaquiles igual que los sencillos (pasos 1-9)',
			'Cocinar 100g de fajitas de res en la plancha a fuego alto',
			'Cortar en tiras',
			'Poner la res HASTA ARRIBA de los chilaquiles (lo último)',
			'Servir con 100g de frijoles refritos al lado'
		],
		'Molletes sencillos': [
			'Tomar 2 bolillos y cortar cada uno a la mitad con cuchillo de sierra',
			'Poner las 4 mitades en la plancha o comal, con la parte cortada hacia abajo',
			'Calentar 2 minutos hasta que estén crujientes',
			'Voltear y untar 40g de frijoles refritos en cada mitad con cuchara',
			'Poner encima 1 rebanada de queso manchego en cada una',
			'Meter al horno o salamandra hasta que el queso se derrita y gratine',
			'Sacar y servir en plato',
			'Poner 60g de pico de gallo al lado como complemento'
		],
		'Molletes Atoyac': [
			'Tomar 2 bolillos y cortar cada uno a la mitad con cuchillo de sierra',
			'Poner las 4 mitades en la plancha, parte cortada hacia abajo, 2 minutos',
			'Voltear y untar 40g de frijoles refritos en cada mitad',
			'Dorar 2 tiras de tocino en la plancha hasta que estén crujientes',
			'Poner 60g de pollo desmenuzado sobre los frijoles',
			'Poner las tiras de tocino dorado encima del pollo',
			'Cubrir con 1 rebanada de queso manchego en cada mitad',
			'Meter al horno hasta que gratine el queso',
			'Servir con 60g de pico de gallo al lado'
		],
		'Chapata jamón de pavo': [
			'PREGUNTAR al cliente: ¿pan normal o integral? ¿quiere mayonesa?',
			'Tomar el pan chapata y abrirlo por la mitad con cuchillo de sierra',
			'Poner ambas mitades en la plancha para calentar ~1 min',
			'Si pidió mayonesa: untar 1 cucharada en la parte de abajo del pan',
			'Poner 4 rebanadas de jamón de pavo (80g) dobladas sobre el pan',
			'Cortar cebolla en aros delgados y poner encima del jamón',
			'Poner 1 rebanada de panela (40g) y 1 de manchego',
			'Colocar 2 hojas de lechuga lavadas',
			'Cortar 3 rodajas de tomate y ponerlas',
			'Cerrar el pan con la otra mitad',
			'Freír 120g de papas fritas y servir al lado'
		],
		'Chapata de pollo': [
			'PREGUNTAR al cliente: ¿pan normal o integral? ¿quiere mayonesa?',
			'Abrir el pan chapata y calentarlo en la plancha ~1 min',
			'Si pidió mayonesa: untar 1 cucharada en la parte de abajo',
			'Cortar pimiento verde y rojo en tiritas, cebolla en aros',
			'Cocinar 120g de pollo a la plancha con los pimientos y cebolla',
			'Caramelizar la cebolla (dejar que se dore bien, ~3 min)',
			'Poner el pollo con verduras sobre el pan',
			'Agregar 1 rebanada de panela (40g) y 1 de manchego',
			'Colocar 2 hojas de lechuga y 3 rodajas de tomate',
			'Cerrar el pan',
			'Freír 120g de papas fritas y servir al lado',
			'Si pide ensalada en vez de papas: lechuga, tomate, zanahoria, pepino y aguacate'
		],
		'Chapata fajitas de res': [
			'PREGUNTAR al cliente: ¿pan normal o integral? ¿quiere mayonesa?',
			'Abrir el pan chapata y calentarlo en la plancha ~1 min',
			'Si pidió mayonesa: untar 1 cucharada en la parte de abajo',
			'Cortar pimiento verde y rojo en tiritas, cebolla en aros',
			'Cocinar 120g de fajitas de res en la plancha a fuego alto con los pimientos y cebolla',
			'Caramelizar la cebolla (dejar que se dore bien, ~3 min)',
			'Poner las fajitas con verduras sobre el pan',
			'Agregar 1 rebanada de panela (40g) y 1 de manchego',
			'Colocar 2 hojas de lechuga y 3 rodajas de tomate',
			'Cerrar el pan',
			'Freír 120g de papas fritas y servir al lado',
			'Si pide ensalada en vez de papas: lechuga, tomate, zanahoria, pepino y aguacate'
		],
		'Plato de fruta': [
			'Lavar bien 1 manzana chica con agua',
			'Cortar la manzana en cubitos pequeños (quitar el corazón con semillas)',
			'Pelar 1 plátano y cortarlo en rodajas redondas',
			'Total entre manzana y plátano debe ser 200g',
			'Poner la fruta en un plato hondo o bowl',
			'Agregar 100g de yogurt natural encima de la fruta',
			'Poner 2 cucharadas de granola sobre el yogurt',
			'Terminar con 1 cucharadita de miel de abeja por encima'
		],
	};

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
					<svg class="countdown-ring" viewBox="0 0 36 36" width="32" height="32">
						<circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--c-linea)" stroke-width="3" />
						<circle cx="18" cy="18" r="15.9" fill="none"
							stroke={restante !== null && restante <= 0 ? 'var(--c-peligro)' : restante !== null && restante < 60000 ? 'var(--c-preparando)' : 'var(--c-hoja-fuerte)'}
							stroke-width="3" stroke-dasharray="100" stroke-dashoffset={100 - countdownPct * 100}
							stroke-linecap="round" transform="rotate(-90 18 18)" />
					</svg>
					<span class="countdown-txt">{countdownTexto}</span>
				</span>
			{/if}
			<span class="tiempo">{t.texto}</span>
		</div>
	</div>
	<ul>
		{#each pedido.items as it (it.id)}
			<li>
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
						{#if tooltipItem === it.nombre && RECETAS[it.nombre]}
							<span class="tooltip-receta">
								<strong>Receta: {it.nombre}</strong>
								{#each RECETAS[it.nombre] as paso, i}
									<span class="paso">{i + 1}. {paso}</span>
								{/each}
							</span>
						{/if}
					</span>
					{#if it.opciones.length}<span class="op">{it.opciones.map((o) => o.nombre).join(' · ')}</span>{/if}
					{#if it.notas}<span class="op">{it.notas}</span>{/if}
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
	li { display: grid; grid-template-columns: 24px 1fr; gap: var(--sp-2); }
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
	.countdown { display: inline-flex; align-items: center; gap: var(--sp-1); font-variant-numeric: tabular-nums; font-weight: 600; font-size: var(--fs-14); color: var(--c-hoja-fuerte); }
	.countdown.vencido { color: var(--c-peligro); animation: pulso-timer 1s infinite alternate; }
	.countdown-ring { flex-shrink: 0; }
	.countdown-txt { min-width: 3ch; }
	@keyframes pulso-timer { from { opacity: 1; } to { opacity: 0.5; } }

	/* Recipe tooltip */
	.nombre-prod { position: relative; }
	.tiene-receta { text-decoration: underline dotted var(--c-texto-suave); text-underline-offset: 3px; cursor: help; }
	.tooltip-receta {
		position: absolute; bottom: calc(100% + 6px); left: 0; z-index: 10;
		background: var(--c-papel, #fefef5); border: 1px solid var(--c-linea); border-radius: var(--r-sm);
		box-shadow: var(--sh-2, 0 4px 12px rgba(0,0,0,.12));
		padding: var(--sp-2) var(--sp-3); min-width: 220px; max-width: 320px;
		display: grid; gap: 2px; font-size: var(--fs-12, 12px); line-height: 1.4;
		pointer-events: none; white-space: normal;
	}
	.tooltip-receta strong { font-size: var(--fs-14, 13px); margin-bottom: 2px; }
	.tooltip-receta .paso { display: block; color: var(--c-texto-suave); }
</style>
