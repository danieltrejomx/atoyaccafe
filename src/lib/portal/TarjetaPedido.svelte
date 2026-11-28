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

	// --- Recipe tooltip ---
	const RECETAS: Record<string, string[]> = {
		'Ensalada Tradicional': ['80g lechuga + 30g espinaca', '5 tomates cherry, 30g zanahoria, 40g pepino', '\u00BC aguacate + 40g panela', '15g crotones + 1 cda semilla girasol', '40ml aderezo ranch o mil islas'],
		'Ensalada Jam\u00F3n de pavo': ['Base de ensalada tradicional', '+ 3 rebanadas jam\u00F3n de pavo (60g)'],
		'Ensalada de at\u00FAn': ['Base de ensalada tradicional', '+ 1 lata at\u00FAn Dolores escurrido (100g)'],
		'Ensalada de pollo': ['Base de ensalada tradicional', '+ 120g pollo a la plancha'],
		'Ensalada de res': ['Base de ensalada tradicional', '+ 120g fajitas de res'],
		'Chilaquiles sencillos': ['1 taza (250ml) salsa verde + 120g totopos', '2 cdas crema, 30g queso, 15g cebolla', '\u00BC aguacate', 'Ramita de epazote', '100g frijoles al lado'],
		'Chilaquiles con pollo': ['Igual que sencillos', '+ 100g pollo hasta arriba'],
		'Chilaquiles con res': ['Igual que sencillos', '+ 100g res hasta arriba'],
		'Molletes sencillos': ['Cortar 2 bolillos, calentar 2 min', '40g frijoles en cada pan', '2 rebanadas queso manchego', '60g pico de gallo'],
		'Molletes Atoyac': ['Cortar 2 bolillos, calentar 2 min', '40g frijoles en cada pan', '60g pollo + 2 tiras tocino', '2 rebanadas queso manchego', '60g pico de gallo'],
		'Chapata jam\u00F3n de pavo': ['Pan normal o integral, \u00BFmayonesa?', '4 rebanadas jam\u00F3n (80g) + cebolla', '1 panela + 1 manchego', '2 hojas lechuga + 3 rodajas tomate', '120g papas fritas'],
		'Chapata de pollo': ['Pan normal o integral, \u00BFmayonesa?', '120g pollo + pimiento + cebolla caramelizada', '1 panela + 1 manchego', '2 hojas lechuga + 3 rodajas tomate', '120g papas fritas'],
		'Chapata fajitas de res': ['Pan normal o integral, \u00BFmayonesa?', '120g fajitas + pimiento + cebolla caramelizada', '1 panela + 1 manchego', '2 hojas lechuga + 3 rodajas tomate', '120g papas fritas'],
		'Plato de fruta': ['1 manzana chica + 1 pl\u00E1tano (200g total)', '100g yogurt natural', '2 cdas granola + 1 cdita miel'],
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
