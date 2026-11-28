<script lang="ts">
	import { carrito, precioUnit } from '$lib/kiosco/carrito.svelte';
	import Boton from './Boton.svelte';
	import Icono from './Icono.svelte';

	let { abierto, oncerrar, onpagar }: { abierto: boolean; oncerrar: () => void; onpagar: () => void } = $props();
	let dlg: HTMLDialogElement;
	let quitando = $state<string | null>(null);

	$effect(() => {
		if (abierto && !dlg.open) dlg.showModal();
		else if (!abierto && dlg.open) dlg.close();
	});
	function velo(e: MouseEvent) {
		if (e.target === dlg) oncerrar();
	}
	function menos(clave: string, cantidad: number) {
		if (cantidad > 1) carrito.cambiar(clave, -1);
		else quitando = clave;
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog bind:this={dlg} onclick={velo} onclose={oncerrar} aria-label="Tu pedido">
	<header>
		<h2>Tu pedido</h2>
		<button class="cerrar" aria-label="Cerrar" onclick={oncerrar}><Icono nombre="cerrar" /></button>
	</header>
	<ul>
		{#each carrito.lineas as l (l.clave)}
			<li>
				<div class="info">
					<strong>{l.producto.nombre}</strong>
					{#if l.opciones.length}<span>{l.opciones.map((o) => o.nombre).join(' · ')}</span>{/if}
					{#if l.notas}<span class="notas-line">{l.notas}</span>{/if}
					{#if quitando === l.clave}
						<span class="quitar" role="group" aria-label="Quitar producto">
							¿Quitar?
							<button onclick={() => (carrito.quitar(l.clave), (quitando = null))}>Sí</button>
							<button onclick={() => (quitando = null)}>No</button>
						</span>
					{/if}
				</div>
				<div class="cont">
					<button aria-label="Menos" onclick={() => menos(l.clave, l.cantidad)}><Icono nombre="menos" /></button>
					<output>{l.cantidad}</output>
					<button aria-label="Más" onclick={() => carrito.cambiar(l.clave, 1)}><Icono nombre="mas" /></button>
				</div>
				<span class="sub">${precioUnit(l) * l.cantidad}</span>
			</li>
		{:else}
			<li class="vacio">Tu pedido está vacío. Elige algo rico.</li>
		{/each}
	</ul>
	<footer>
		<div class="total"><span>Total</span><strong>${carrito.total}</strong></div>
		<Boton variante="pago" tamano="xl" disabled={!carrito.cantidad} onclick={onpagar}>Continuar al pago</Boton>
	</footer>
</dialog>

<style>
	dialog {
		margin: 0 0 0 auto;
		width: 440px;
		max-width: 100%;
		height: 100dvh;
		max-height: none;
		border: 0;
		padding: 0;
		background: var(--c-papel);
		color: var(--c-texto);
		box-shadow: var(--sh-3);
		flex-direction: column;
	}
	dialog[open] { display: flex; animation: entra var(--dur-3) var(--ease-salida); }
	dialog::backdrop { background: rgba(31, 45, 36, 0.4); }
	@keyframes entra { from { transform: translateX(100%); } }
	header { display: flex; align-items: center; justify-content: space-between; padding: var(--sp-4) var(--sp-5); }
	h2 { margin: 0; font: 600 var(--fs-32) var(--f-titulo); }
	.cerrar { width: var(--toque-kiosco); height: var(--toque-kiosco); }
	button { border: 0; background: transparent; color: inherit; cursor: pointer; touch-action: manipulation; border-radius: 50%; display: grid; place-items: center; }
	button:focus-visible { outline: none; box-shadow: var(--foco); }
	ul { list-style: none; margin: 0; padding: 0 var(--sp-5); overflow-y: auto; flex: 1; }
	li { display: grid; grid-template-columns: 1fr auto auto; gap: var(--sp-3); align-items: center; padding: var(--sp-4) 0; border-bottom: 1px solid var(--c-linea); }
	li.vacio { display: block; color: var(--c-texto-suave); border: 0; padding-top: var(--sp-6); }
	.info { display: flex; flex-direction: column; gap: 2px; font-size: var(--fs-16); }
	.info span { color: var(--c-texto-suave); font-size: var(--fs-14); }
	.notas-line { color: var(--c-cancelado) !important; font-weight: 600; }
	.quitar { display: flex; align-items: center; gap: var(--sp-2); color: var(--c-barro-texto) !important; font-weight: 600; }
	.quitar button { border-radius: var(--r-pill); padding: 0 var(--sp-5); min-height: var(--toque-kiosco); background: var(--c-arena); font: 600 var(--fs-14) var(--f-titulo); }
	.cont { display: flex; align-items: center; gap: var(--sp-1); }
	.cont button { width: var(--toque-kiosco); height: var(--toque-kiosco); background: var(--c-arena); }
	output { min-width: 28px; text-align: center; font: 600 var(--fs-20) var(--f-titulo); font-variant-numeric: tabular-nums; }
	.sub { font: 600 var(--fs-18) var(--f-titulo); font-variant-numeric: tabular-nums; min-width: 56px; text-align: right; }
	footer { padding: var(--sp-5); display: grid; gap: var(--sp-4); border-top: 1px solid var(--c-linea); background: var(--c-papel); }
	.total { display: flex; justify-content: space-between; align-items: baseline; }
	.total strong { font: 600 var(--fs-32) var(--f-titulo); font-variant-numeric: tabular-nums; }
</style>
