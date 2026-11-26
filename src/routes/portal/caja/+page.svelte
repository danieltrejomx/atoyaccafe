<script lang="ts">
	import { onMount } from 'svelte';
	import CapturaManual from '$lib/portal/CapturaManual.svelte';
	import Icono from '$lib/portal/Icono.svelte';
	import TarjetaPedido from '$lib/portal/TarjetaPedido.svelte';
	import { pedidosVivos } from '$lib/portal/pedidos.svelte';

	let nuevo = $state(false);
	const pv = pedidosVivos();
	onMount(pv.iniciar);
	const pendientes = $derived(
		pv.lista.filter((p) => p.pagoEstado === 'pendiente' && p.estado !== 'cancelado').sort((a, b) => a.creadoEn - b.creadoEn)
	);
</script>

<div class="pagina">
	<div class="fila" style="justify-content: space-between">
		<h1>Caja</h1>
		<button class="btn" onclick={() => (nuevo = true)}><Icono nombre="plus" /> Capturar pedido</button>
	</div>
	<p class="etiqueta">Pagos pendientes: {pendientes.length}</p>
	{#if pv.error}<p class="error" role="alert">{pv.error}</p>{/if}
	{#if pendientes.length}
		<div class="rejilla">
			{#each pendientes as p (p.id)}
				<TarjetaPedido pedido={p} ahora={pv.ahora} puedeCobrar accion={pv.accion} />
			{/each}
		</div>
	{:else}
		<p class="vacio">No hay pagos pendientes.</p>
	{/if}
</div>

{#if nuevo}
	<div class="modal-fondo" role="presentation" onclick={(e) => e.target === e.currentTarget && (nuevo = false)}>
		<div class="modal" role="dialog" aria-modal="true" aria-label="Capturar pedido">
			<div class="fila" style="justify-content: space-between">
				<h2>Pedido de mostrador</h2>
				<button class="btn quieto chico" onclick={() => (nuevo = false)} aria-label="Cerrar"><Icono nombre="x" /></button>
			</div>
			<CapturaManual canal="caja" onCreado={() => ((nuevo = false), pv.recargar())} />
		</div>
	</div>
{/if}

<style>
	.rejilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--sp-4); align-items: start; }
</style>
