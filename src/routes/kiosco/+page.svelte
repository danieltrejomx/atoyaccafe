<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { api } from '$lib/api';
	import { crearStream } from '$lib/stream.svelte';
	import { CATEGORIAS, type Opcion, type PagoMetodo, type Pedido, type Producto } from '$lib/types';
	import { carrito } from '$lib/kiosco/carrito.svelte';
	import { cobro, enviarTicket } from '$lib/kiosco/cliente';
	import HojaProducto from '$lib/kiosco/HojaProducto.svelte';
	import Pago from '$lib/kiosco/Pago.svelte';
	import Reposo from '$lib/kiosco/Reposo.svelte';
	import Ticket from '$lib/kiosco/Ticket.svelte';
	import Turno from '$lib/kiosco/Turno.svelte';
	import Boton from '$lib/ui/Boton.svelte';
	import CajonCarrito from '$lib/ui/CajonCarrito.svelte';
	import Icono from '$lib/ui/Icono.svelte';
	import RielCategorias from '$lib/ui/RielCategorias.svelte';
	import TarjetaProducto from '$lib/ui/TarjetaProducto.svelte';
	import type { PageProps } from './$types';

	const IDLE_AVISO = 75;
	const IDLE_CUENTA = 15;

	let { data }: PageProps = $props();
	type Paso = 'reposo' | 'menu' | 'pago' | 'tarjeta' | 'ticket' | 'turno';
	let paso = $state<Paso>('reposo');
	let categoria = $state<string>(CATEGORIAS[0]);
	let elegido = $state<Producto | null>(null);
	let cajon = $state(false);
	let pedido = $state<Pedido | null>(null);
	let error = $state('');
	let ocupado = $state(false);
	let inactivo = $state(0); // segundos desde el último toque
	let intento = 0; // invalida el sondeo de un cobro abandonado
	let ordenId = '';

	const visibles = $derived(data.productos.filter((p) => p.categoria === categoria));
	const stream = crearStream({ 'pedido.creado': () => invalidateAll(), 'pedido.actualizado': () => invalidateAll() }, { alAbrir: () => invalidateAll() });

	onMount(() => {
		stream.abrir();
		const t = setInterval(() => {
			inactivo++;
			if (inactivo >= IDLE_AVISO + IDLE_CUENTA && !['reposo', 'tarjeta', 'turno'].includes(paso)) reposo();
		}, 1000);
		return () => (clearInterval(t), stream.cerrar());
	});

	// Pantalla de turno: vuelve sola (más tiempo si falta copiar la CLABE).
	$effect(() => {
		if (paso !== 'turno') return;
		const t = setTimeout(reposo, pedido?.pagoMetodo === 'transferencia' ? 45_000 : 20_000);
		return () => clearTimeout(t);
	});

	const avisando = $derived(inactivo >= IDLE_AVISO && !['reposo', 'tarjeta', 'turno'].includes(paso));

	function reposo() {
		intento++;
		carrito.vaciar();
		(elegido = null), (cajon = false), (pedido = null), (error = ''), (ocupado = false);
		categoria = CATEGORIAS[0];
		paso = 'reposo';
	}

	function agregar(p: Producto, o: Opcion[], n: number) {
		carrito.agregar(p, o, n);
	}

	async function pagar(metodo: PagoMetodo, cliente: string, paraLlevar: boolean) {
		ocupado = true;
		error = '';
		try {
			pedido = await api.crearPedido({
				canal: 'kiosco',
				cliente: cliente || undefined,
				pagoMetodo: metodo,
				notas: paraLlevar ? 'Para llevar' : 'Comer aquí',
				items: carrito.items()
			});
			if (metodo === 'tarjeta') await cobrar(pedido);
			else paso = 'ticket';
		} catch (e) {
			error = (e as Error).message;
		} finally {
			ocupado = false;
		}
	}

	const RECHAZO = 'No se pudo cobrar. Intenta de nuevo o elige otra forma de pago.';
	async function cobrar(p: Pedido) {
		const mio = ++intento;
		paso = 'tarjeta';
		try {
			ordenId = (await cobro.iniciar(p.id)).ordenId;
		} catch (e) {
			return fallo((e as Error).message);
		}
		while (mio === intento) {
			await new Promise((r) => setTimeout(r, 2000));
			if (mio !== intento) return;
			const { estado } = await cobro.estado(ordenId).catch(() => ({ estado: 'pendiente' as const }));
			if (estado === 'aprobado') return void (paso = 'ticket');
			if (estado !== 'pendiente') return fallo(RECHAZO);
		}
	}
	function fallo(msg: string) {
		intento++;
		error = msg;
		paso = 'pago';
	}
	async function cancelarCobro() {
		intento++;
		await cobro.cancelar(ordenId).catch(() => {});
		error = '';
		paso = 'pago';
	}

	async function ticket(telefono: string) {
		try {
			await enviarTicket(pedido!.id, telefono);
			paso = 'turno';
			return null;
		} catch (e) {
			return (e as Error).message;
		}
	}
</script>

<svelte:head><title>Kiosco | Atoyac Café</title></svelte:head>
<svelte:window onpointerdown={() => (inactivo = 0)} oncontextmenu={(e) => e.preventDefault()} />

<main>
	{#if paso === 'reposo'}
		<Reposo onentrar={() => (paso = 'menu')} />
	{:else if paso === 'menu'}
		<div class="menu">
			<nav>
				<img src="/img/logo.svg" alt="Atoyac Café" />
				<RielCategorias categorias={CATEGORIAS} activa={categoria} oncambiar={(c) => (categoria = c)} />
			</nav>
			<section>
				<h1>{categoria}</h1>
				{#key categoria}
					<div class="rejilla">
						{#each visibles as p, i (p.id)}
							<div class="entra" style:--i={Math.min(i, 8)}><TarjetaProducto producto={p} onelegir={(x) => (elegido = x)} /></div>
						{:else}
							<p class="vacio">Por ahora no hay nada aquí. Prueba otra categoría.</p>
						{/each}
					</div>
				{/key}
			</section>
			{#if carrito.cantidad}
				{#key carrito.cantidad}
					<button class="flotante" onclick={() => (cajon = true)} aria-label="Ver tu pedido">
						<Icono nombre="carrito" tam={32} />
						<span>{carrito.cantidad} · ${carrito.total}</span>
					</button>
				{/key}
			{/if}
		</div>
		<HojaProducto producto={elegido} onagregar={agregar} oncerrar={() => (elegido = null)} />
		<CajonCarrito abierto={cajon} oncerrar={() => (cajon = false)} onpagar={() => ((cajon = false), (error = ''), (paso = 'pago'))} />
	{:else if paso === 'pago'}
		<Pago {error} {ocupado} onpagar={pagar} onvolver={() => (paso = 'menu')} />
	{:else if paso === 'tarjeta'}
		<div class="espera">
			<Icono nombre="terminal" tam={48} />
			<h1>Acerca o inserta tu tarjeta en la terminal</h1>
			<p>Esperando el pago…</p>
			<Boton variante="quieto" tamano="xl" onclick={cancelarCobro}>Cancelar cobro</Boton>
		</div>
	{:else if paso === 'ticket'}
		<Ticket alEnviar={ticket} alOmitir={() => (paso = 'turno')} />
	{:else if pedido}
		<Turno {pedido} clabe={data.clabe} alTerminar={reposo} />
	{/if}

	{#if avisando}
		<div class="velo">
			<div role="alertdialog" aria-labelledby="sigues">
				<h2 id="sigues">¿Sigues ahí?</h2>
				<p>Empezamos de nuevo en {IDLE_AVISO + IDLE_CUENTA - inactivo} s</p>
				<div>
					<Boton tamano="xl" onclick={() => (inactivo = 0)}>Seguir ordenando</Boton>
					<Boton variante="secundario" tamano="xl" onclick={reposo}>Empezar de nuevo</Boton>
				</div>
			</div>
		</div>
	{/if}
</main>

<style>
	:global(html, body) { height: 100%; margin: 0; overflow: hidden; }
	main {
		height: 100dvh;
		overflow: hidden;
		background: var(--c-blanco);
		color: var(--c-texto);
		font-family: var(--f-texto);
		user-select: none;
		-webkit-user-select: none;
		touch-action: manipulation;
	}
	.menu { display: grid; grid-template-columns: 232px 1fr; height: 100%; position: relative; }
	nav { background: var(--c-arena); display: flex; flex-direction: column; align-items: center; padding: var(--sp-6) var(--sp-3); gap: var(--sp-6); }
	nav img { width: 72px; }
	nav :global(.riel) { margin: auto 0; }
	section { padding: var(--sp-6); overflow-y: auto; }
	h1 { margin: 0 0 var(--sp-5); font: 600 var(--fs-40) var(--f-titulo); }
	.rejilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--sp-5); padding-bottom: 120px; }
	.entra { animation: entra var(--dur-3) var(--ease-salida) backwards; animation-delay: calc(var(--i) * 40ms); display: contents; }
	.entra > :global(*) { animation: inherit; animation-delay: inherit; }
	@keyframes entra { from { opacity: 0; transform: translateY(12px); } }
	.vacio { color: var(--c-texto-suave); font-size: var(--fs-20); }
	.flotante {
		position: absolute;
		right: var(--sp-5);
		bottom: var(--sp-5);
		height: var(--toque-kiosco-xl);
		padding: 0 var(--sp-6);
		display: flex;
		align-items: center;
		gap: var(--sp-3);
		border: 0;
		border-radius: var(--r-pill);
		background: var(--c-bosque);
		color: var(--c-texto-inverso);
		font: 600 var(--fs-24) var(--f-titulo);
		font-variant-numeric: tabular-nums;
		box-shadow: var(--sh-3);
		cursor: pointer;
		animation: rebote var(--dur-2) var(--ease-rebote);
	}
	.flotante:focus-visible { outline: none; box-shadow: var(--foco); }
	@keyframes rebote { 50% { transform: scale(1.08); } }
	.espera { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--sp-4); background: var(--c-arena); color: var(--c-hoja); text-align: center; padding: var(--sp-6); }
	.espera h1 { margin: 0; color: var(--c-bosque); font-size: var(--fs-56); }
	.espera p { margin: 0; font-size: var(--fs-24); color: var(--c-texto-suave); }
	.velo { position: fixed; inset: 0; background: rgba(31, 45, 36, 0.6); display: grid; place-items: center; z-index: var(--z-aviso); }
	[role='alertdialog'] { background: var(--c-papel); border-radius: var(--r-lg); padding: var(--sp-7); text-align: center; box-shadow: var(--sh-3); }
	[role='alertdialog'] h2 { margin: 0; font: 600 var(--fs-56) var(--f-titulo); }
	[role='alertdialog'] p { font-size: var(--fs-24); color: var(--c-texto-suave); font-variant-numeric: tabular-nums; }
	[role='alertdialog'] div { display: flex; gap: var(--sp-4); justify-content: center; }
	@media (prefers-reduced-motion: reduce) { .entra, .flotante { animation: none; } }
</style>
