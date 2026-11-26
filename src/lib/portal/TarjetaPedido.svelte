<script lang="ts">
	import type { Pedido } from '$lib/types';
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
		<span class="tiempo">{t.texto}</span>
	</div>
	<ul>
		{#each pedido.items as it (it.id)}
			<li>
				<b>{it.cantidad}</b>
				<span>
					{it.nombre}
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
	.canal { color: var(--canal) !important; font-size: var(--fs-14) !important; }
	.turno { font: 700 var(--fs-56)/1 var(--f-titulo); font-variant-numeric: tabular-nums; }
	ul { list-style: none; margin: 0; padding: var(--sp-3) 0; display: grid; gap: var(--sp-2); border-block: 1px solid var(--c-linea); }
	li { display: grid; grid-template-columns: 24px 1fr; gap: var(--sp-2); }
	li b { font-family: var(--f-titulo); font-variant-numeric: tabular-nums; }
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
</style>
