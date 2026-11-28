<script lang="ts">
	import { carrito, precioUnit } from './carrito.svelte';
	import type { PagoMetodo } from '$lib/types';
	import Boton from '$lib/ui/Boton.svelte';
	import Icono, { type NombreIcono } from '$lib/ui/Icono.svelte';

	let {
		error,
		ocupado,
		onpagar,
		onvolver
	}: { error: string; ocupado: boolean; onpagar: (m: PagoMetodo, cliente: string, paraLlevar: boolean, cupon?: string) => void; onvolver: () => void } = $props();

	let cliente = $state('');
	let paraLlevar = $state(false);
	let mostrarCupon = $state(false);
	let cupon = $state('');
	const metodos: { id: PagoMetodo; nombre: string; icono: NombreIcono }[] = [
		{ id: 'efectivo', nombre: 'Efectivo', icono: 'efectivo' },
		{ id: 'tarjeta', nombre: 'Tarjeta', icono: 'tarjeta' }
	];
</script>

<div class="pago">
	<aside>
		<Boton variante="quieto" tamano="lg" icono="flecha-izq" onclick={onvolver}>Seguir ordenando</Boton>
		<h2>Tu pedido</h2>
		<ul>
			{#each carrito.lineas as l (l.clave)}
				<li>
					<span>{l.cantidad} × {l.producto.nombre}{l.opciones.length ? ` (${l.opciones.map((o) => o.nombre).join(', ')})` : ''}</span>
					<b>${precioUnit(l) * l.cantidad}</b>
				</li>
			{/each}
		</ul>
		<div class="total"><span>Total</span><strong>${carrito.total}</strong></div>
	</aside>
	<section>
		<div class="donde" role="radiogroup" aria-label="Dónde lo comes">
			<button role="radio" aria-checked={!paraLlevar} class:on={!paraLlevar} onclick={() => (paraLlevar = false)}>Comer aquí</button>
			<button role="radio" aria-checked={paraLlevar} class:on={paraLlevar} onclick={() => (paraLlevar = true)}>Para llevar</button>
		</div>
		<label>
			<span>¿A nombre de quién? <small>(opcional)</small></span>
			<input bind:value={cliente} maxlength="60" autocomplete="off" />
		</label>
		<h2>¿Cómo quieres pagar?</h2>
		{#if error}<p class="error" role="alert"><Icono nombre="alerta" tam={20} /> {error}</p>{/if}
		<div class="metodos">
			{#each metodos as m (m.id)}
				<button class="metodo" disabled={ocupado} onclick={() => onpagar(m.id, cliente.trim(), paraLlevar)}>
					<Icono nombre={m.icono} tam={48} />
					<span>{m.nombre}</span>
				</button>
			{/each}
		</div>
		{#if mostrarCupon}
			<div class="cupon-zona">
				<label>
					<span>Clave de dueño</span>
					<input bind:value={cupon} maxlength="30" autocomplete="off" placeholder="Ingresa tu clave" />
				</label>
				<Boton tamano="lg" disabled={!cupon.trim() || ocupado} onclick={() => onpagar('efectivo', cliente.trim(), paraLlevar, cupon.trim())}>Aplicar cupón</Boton>
			</div>
		{:else}
			<button class="link-cupon" onclick={() => (mostrarCupon = true)}>Tengo un cupón</button>
		{/if}
	</section>
</div>

<style>
	.pago { display: grid; grid-template-columns: 380px 1fr; height: 100%; background: var(--c-arena); }
	aside { padding: var(--sp-5); display: flex; flex-direction: column; gap: var(--sp-3); background: var(--c-papel); overflow: hidden; }
	h2 { margin: 0; font: 600 var(--fs-32) var(--f-titulo); }
	ul { list-style: none; margin: 0; padding: 0; overflow-y: auto; flex: 1; }
	li { display: flex; justify-content: space-between; gap: var(--sp-3); padding: var(--sp-3) 0; border-bottom: 1px solid var(--c-linea); }
	b, strong { font-variant-numeric: tabular-nums; font-family: var(--f-titulo); }
	.total { display: flex; justify-content: space-between; align-items: baseline; }
	.total strong { font-size: var(--fs-40); }
	section { padding: var(--sp-6); display: flex; flex-direction: column; gap: var(--sp-5); justify-content: center; }
	.donde { display: flex; gap: var(--sp-2); }
	.donde button { flex: 1; min-height: var(--toque-kiosco); border-radius: var(--r-pill); border: 1.5px solid var(--c-linea-fuerte); background: var(--c-blanco); font: 600 var(--fs-18) var(--f-titulo); cursor: pointer; }
	.donde button.on { background: var(--c-hoja-fuerte); border-color: var(--c-hoja-fuerte); color: #fff; }
	label { display: grid; gap: var(--sp-2); font: 600 var(--fs-16) var(--f-texto); }
	small { font-weight: 400; color: var(--c-texto-suave); }
	input { height: var(--toque-kiosco); border-radius: var(--r-md); border: 1.5px solid var(--c-linea-fuerte); padding: 0 var(--sp-4); font: 400 var(--fs-20) var(--f-texto); background: var(--c-blanco); user-select: text; }
	input:focus-visible { outline: none; box-shadow: var(--foco); }
	.error { margin: 0; display: flex; gap: var(--sp-2); align-items: center; color: var(--c-peligro); font-weight: 600; }
	.metodos { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--sp-4); }
	.metodo { height: 200px; border: 0; border-radius: var(--r-lg); background: var(--c-blanco); box-shadow: var(--sh-1); color: var(--c-bosque); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--sp-3); font: 600 var(--fs-24) var(--f-titulo); cursor: pointer; touch-action: manipulation; transition: transform var(--dur-1); }
	.metodo:active { transform: scale(0.97); }
	.metodo:disabled { opacity: 0.45; }
	button:focus-visible { outline: none; box-shadow: var(--foco); }
	.link-cupon { border: 0; background: none; color: var(--c-texto-suave); font: 400 var(--fs-16) var(--f-texto); text-decoration: underline; cursor: pointer; align-self: center; }
	.cupon-zona { display: flex; gap: var(--sp-3); align-items: flex-end; }
	.cupon-zona label { flex: 1; }
</style>
