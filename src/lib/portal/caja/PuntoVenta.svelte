<script lang="ts">
	// Punto de venta de mostrador a pantalla completa, pensado para tacto.
	import { onMount } from 'svelte';
	import { api } from '$lib/api';
	import { CATEGORIAS, PAGO_METODOS, type Categoria, type Opcion, type PagoMetodo, type Pedido, type Producto } from '$lib/types';
	import Icono from '$lib/ui/Icono.svelte';
	import { pesos } from '../acceso';
	import { pedidosVivos } from '../pedidos.svelte';

	type Linea = { key: string; producto: Producto; opciones: Opcion[]; cantidad: number };

	let productos = $state<Producto[] | null>(null);
	let categoria = $state<Categoria>(CATEGORIAS[0]);
	let lineas = $state<Linea[]>([]);
	let cliente = $state('');
	let pago = $state<PagoMetodo>('efectivo');
	let recibido = $state<number | null>(null); // null = exacto
	let hoja = $state<{ producto: Producto; sel: Set<number> } | null>(null);
	let error = $state('');
	let enviando = $state(false);
	let creado = $state<Pedido | null>(null); // pedido ya creado cuyo cobro falló: se reintenta sin duplicar
	let listo = $state<Pedido | null>(null);
	let panel = $state(false);
	let timer: ReturnType<typeof setTimeout>;

	const pv = pedidosVivos();
	onMount(() => {
		api.productos().then((r) => (productos = r), (e) => (error = e.message));
		return pv.iniciar();
	});
	const pendientes = $derived(
		pv.lista.filter((p) => p.pagoEstado === 'pendiente' && p.estado !== 'cancelado').sort((a, b) => a.creadoEn - b.creadoEn)
	);
	const visibles = $derived(productos?.filter((p) => p.categoria === categoria) ?? []);
	const unit = (l: Linea) => l.producto.precio + l.opciones.reduce((s, o) => s + o.precioExtra, 0);
	const total = $derived(lineas.reduce((s, l) => s + unit(l) * l.cantidad, 0));
	const cambio = $derived(recibido === null ? 0 : recibido - total);
	const falta = $derived(pago === 'efectivo' && recibido !== null && recibido < total);
	const grupos = $derived(hoja ? [...new Set(hoja.producto.opciones.map((o) => o.grupo))] : []);

	function agregar(producto: Producto, opciones: Opcion[] = []) {
		const key = `${producto.id}:${opciones.map((o) => o.id).sort().join(',')}`;
		const l = lineas.find((x) => x.key === key);
		if (l) l.cantidad++;
		else lineas.push({ key, producto, opciones, cantidad: 1 });
		recibido = null;
		creado = null;
	}
	function tocar(p: Producto) {
		if (!p.disponible) return;
		if (!p.opciones.length) return agregar(p);
		hoja = { producto: p, sel: new Set(p.opciones.filter((o) => o.porDefecto).map((o) => o.id)) };
	}
	function alternar(o: Opcion) {
		const s = hoja!.sel;
		if (s.has(o.id)) s.delete(o.id);
		else {
			if (o.tipo === 'unica') hoja!.producto.opciones.filter((x) => x.grupo === o.grupo).forEach((x) => s.delete(x.id));
			s.add(o.id);
		}
		hoja!.sel = new Set(s);
	}
	function confirmarHoja() {
		const h = hoja!;
		agregar(h.producto, h.producto.opciones.filter((o) => h.sel.has(o.id)));
		hoja = null;
	}
	function cant(l: Linea, d: number) {
		l.cantidad = Math.min(50, l.cantidad + d);
		if (l.cantidad < 1) lineas = lineas.filter((x) => x !== l);
		recibido = null;
		creado = null;
	}
	function limpiar() {
		lineas = [];
		cliente = '';
		pago = 'efectivo';
		recibido = null;
		creado = null;
		error = '';
	}

	async function cobrar() {
		if (!lineas.length || falta || enviando) return;
		enviando = true;
		error = '';
		try {
			const p =
				creado ??
				(await api.crearPedido({
					canal: 'caja',
					pagoMetodo: pago,
					cliente: cliente.trim() || undefined,
					items: lineas.map((l) => ({ productoId: l.producto.id, cantidad: l.cantidad, opcionIds: l.opciones.map((o) => o.id) }))
				}));
			creado = p;
			listo = await api.confirmarPago(p.id, pago);
			limpiar();
			clearTimeout(timer);
			timer = setTimeout(() => (listo = null), 3000);
		} catch (e) {
			error = creado ? `Pedido creado (turno ${creado.turno}) pero NO se confirmó el pago: ${(e as Error).message}. Vuelve a tocar Cobrar.` : (e as Error).message;
		} finally {
			enviando = false;
		}
	}
	async function cobrarPendiente(p: Pedido) {
		await pv.accion('cobrar', p);
	}
</script>

<div class="caja">
	<header>
		<strong class="marca">Caja</strong>
		<input bind:value={cliente} maxlength="60" placeholder="Cliente (opcional)" autocomplete="off" aria-label="Nombre del cliente" />
		<a class="atras" href="/portal"><Icono nombre="flecha-izq" tam={20} /> Monitor</a>
		<button class="pend" onclick={() => (panel = true)}>
			Pagos pendientes <span class="badge" class:alto={pendientes.length}>{pendientes.length}</span>
		</button>
	</header>

	<nav class="cats" aria-label="Categorías">
		{#each CATEGORIAS as c}
			<button class:on={categoria === c} aria-pressed={categoria === c} onclick={() => (categoria = c)}>{c}</button>
		{/each}
	</nav>

	<main class="menu">
		{#if !productos}
			<p class="aviso">{error || 'Cargando menú…'}</p>
		{:else}
			{#each visibles as p (p.id)}
				<button class="tile" disabled={!p.disponible} onclick={() => tocar(p)}>
					{#if p.foto}<img src={p.foto} alt="" loading="lazy" />{:else}<span class="sinfoto"><Icono nombre="taza" tam={48} /></span>{/if}
					<span class="nom">{p.nombre}</span>
					<span class="pre">{p.disponible ? pesos(p.precio) : 'Agotado'}</span>{#if p.opciones.length && p.disponible}<small class="opc">Personalizable</small>{/if}
				</button>
			{:else}
				<p class="aviso">Sin productos en esta categoría.</p>
			{/each}
		{/if}
	</main>

	<aside class="ticket" aria-label="Ticket">
		<div class="lineas">
			{#each lineas as l (l.key)}
				<div class="linea">
					<div class="desc">
						<b>{l.producto.nombre}</b>
						{#if l.opciones.length}<small>{l.opciones.map((o) => o.nombre).join(', ')}</small>{/if}
						<span class="imp">{pesos(unit(l) * l.cantidad)}</span>
					</div>
					<div class="cant">
						<button aria-label="Quitar uno de {l.producto.nombre}" onclick={() => cant(l, -1)}><Icono nombre="menos" /></button>
						<output>{l.cantidad}</output>
						<button aria-label="Agregar uno de {l.producto.nombre}" onclick={() => cant(l, 1)}><Icono nombre="mas" /></button>
						<button class="quitar" aria-label="Eliminar {l.producto.nombre}" onclick={() => cant(l, -l.cantidad)}><Icono nombre="cerrar" /></button>
					</div>
				</div>
			{:else}
				<p class="aviso">Toca un producto para empezar el pedido.</p>
			{/each}
		</div>
		<div class="pie">
			<div class="total"><span>Total</span><strong>{pesos(total)}</strong></div>
			<div class="pagos">
				{#each PAGO_METODOS as m}
					<button class:on={pago === m} aria-pressed={pago === m} onclick={() => ((pago = m), (recibido = null))}><Icono nombre={m} tam={24} />{m[0].toUpperCase() + m.slice(1)}</button>
				{/each}
			</div>
			{#if pago === 'efectivo' && total > 0}
				<div class="efectivo">
					{#each [50, 100, 200, 500] as n}
						<button class:on={recibido === n} onclick={() => (recibido = n)}>${n}</button>
					{/each}
					<button class:on={recibido === null} onclick={() => (recibido = null)}>Exacto</button>
				</div>
				{#if recibido !== null}
					<p class="cambio" class:falta>{falta ? `Faltan ${pesos(-cambio)}` : `Cambio ${pesos(cambio)}`}</p>
				{/if}
			{/if}
			{#if error}<p class="err" role="alert"><Icono nombre="alerta" /> {error}</p>{/if}
			<div class="acc">
				<button class="vaciar" disabled={!lineas.length || enviando} onclick={limpiar} aria-label="Vaciar ticket"><Icono nombre="borrar" /></button>
				<button class="cobrar" disabled={!lineas.length || falta || enviando} onclick={cobrar}>{enviando ? 'Procesando…' : `Cobrar ${pesos(total)}`}</button>
			</div>
		</div>
	</aside>
</div>

{#if hoja}
	<div class="hoja" role="dialog" aria-modal="true" aria-label="Opciones de {hoja.producto.nombre}">
		<header>
			<h2>{hoja.producto.nombre}</h2>
			<button class="x" onclick={() => (hoja = null)} aria-label="Cancelar"><Icono nombre="cerrar" tam={32} /></button>
		</header>
		<div class="grupos">
			{#each grupos as g}
				<section>
					<p class="etq">{g}{hoja.producto.opciones.find((o) => o.grupo === g)?.tipo === 'unica' ? ' · elige una' : ' · puedes elegir varias'}</p>
					<div class="opts">
						{#each hoja.producto.opciones.filter((o) => o.grupo === g) as o (o.id)}
							<button class:on={hoja.sel.has(o.id)} aria-pressed={hoja.sel.has(o.id)} onclick={() => alternar(o)}>
								{#if hoja.sel.has(o.id)}<Icono nombre="check" />{/if}
								<span>{o.nombre}</span>
								{#if o.precioExtra}<small>+{pesos(o.precioExtra)}</small>{/if}
							</button>
						{/each}
					</div>
				</section>
			{/each}
		</div>
		<button class="ok" onclick={confirmarHoja}>Agregar al pedido</button>
	</div>
{/if}

{#if panel}
	<div class="hoja" role="dialog" aria-modal="true" aria-label="Pagos pendientes">
		<header>
			<h2>Pagos pendientes ({pendientes.length})</h2>
			<button class="x" onclick={() => (panel = false)} aria-label="Cerrar"><Icono nombre="cerrar" tam={32} /></button>
		</header>
		{#if pv.error}<p class="err" role="alert">{pv.error}</p>{/if}
		<div class="pendientes">
			{#each pendientes as p (p.id)}
				<div class="pen">
					<div>
						<span class="tn">Turno {p.turno}</span>
						<span>{p.cliente ?? ''} · {p.pagoMetodo ?? 'sin método'}</span>
						<small>{p.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(', ')}</small>
					</div>
					<strong>{pesos(p.total)}</strong>
					<button class="cobrar" onclick={() => cobrarPendiente(p)}>Cobrar</button>
				</div>
			{:else}
				<p class="aviso">No hay pagos pendientes.</p>
			{/each}
		</div>
	</div>
{/if}

{#if listo}
	<button class="conf" onclick={() => (listo = null)} aria-live="assertive">
		<Icono nombre="check" tam={48} />
		<span>Pago recibido</span>
		<small>TURNO</small>
		<b>{listo.turno}</b>
		<span class="imp">{pesos(listo.total)} · va a cocina</span>
	</button>
{/if}

<style>
	button { font-family: var(--f-titulo); font-weight: 600; cursor: pointer; border: 2px solid var(--c-linea-fuerte); background: var(--c-blanco); color: var(--c-texto); border-radius: var(--r-md); min-height: 64px; display: inline-flex; align-items: center; justify-content: center; gap: var(--sp-2); touch-action: manipulation; user-select: none; transition: transform var(--dur-1); }
	button:active:not(:disabled) { transform: scale(.96); }
	button:disabled { opacity: .45; cursor: not-allowed; }
	button:focus-visible { outline: none; box-shadow: var(--foco); }
	.caja { position: fixed; inset: 0; height: 100dvh; display: grid; grid-template-columns: clamp(150px, 14vw, 220px) 1fr clamp(380px, 30vw, 520px); grid-template-rows: auto 1fr; background: var(--c-papel); overflow: hidden; z-index: var(--z-barra); }
	.caja > header { grid-column: 1 / -1; display: flex; align-items: center; gap: var(--sp-4); background: var(--c-bosque); color: var(--c-texto-inverso); padding: var(--sp-2) var(--sp-4); }
	.marca { font: 700 var(--fs-24) var(--f-titulo); }
	.caja > header input { margin-right: auto; width: min(360px, 30vw); font: var(--fs-18) var(--f-texto); min-height: 56px; padding: 0 var(--sp-3); border: 0; border-radius: var(--r-sm); background: var(--c-blanco); color: var(--c-texto); }
	.atras { color: var(--c-menta-tv); text-decoration: none; font: 600 var(--fs-18) var(--f-titulo); display: inline-flex; align-items: center; gap: var(--sp-2); min-height: 64px; padding: 0 var(--sp-4); }
	.pend { background: var(--c-bosque-2); color: var(--c-texto-inverso); border-color: var(--c-menta-tv); padding: 0 var(--sp-4); font-size: var(--fs-18); }
	.badge { min-width: 36px; height: 36px; display: grid; place-items: center; border-radius: var(--r-pill); background: var(--c-arena); color: var(--c-bosque); font-size: var(--fs-20); }
	.badge.alto { background: var(--c-maiz); }
	.cats { display: flex; flex-direction: column; gap: var(--sp-3); padding: var(--sp-3); background: var(--c-arena); overflow-y: auto; }
	.cats button { flex: 1; min-height: 80px; font-size: var(--fs-24); line-height: 1.1; padding: var(--sp-2); text-align: center; }
	.cats button.on { background: var(--c-hoja-fuerte); border-color: var(--c-hoja-fuerte); color: #fff; }
	.menu { overflow-y: auto; padding: var(--sp-4); display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); grid-auto-rows: auto; gap: var(--sp-3); align-content: start; background: var(--c-blanco); }
	.tile { flex-direction: column; justify-content: flex-start; align-items: stretch; padding: 0; overflow: hidden; text-align: center; gap: 0; }
	.tile img, .sinfoto { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; background: var(--c-salvia-claro); display: grid; place-items: center; color: var(--c-salvia); }
	.nom { font-size: var(--fs-20); line-height: 1.15; padding: var(--sp-2) var(--sp-2) 0; }
	.pre { font-size: var(--fs-20); color: var(--c-barro-texto); padding: 0 var(--sp-2) var(--sp-2); }
	.opc { font-size: var(--fs-14); color: var(--c-texto-suave); font-weight: 500; padding-bottom: var(--sp-2); margin-top: calc(-1 * var(--sp-1)); }
	.aviso { grid-column: 1 / -1; color: var(--c-texto-suave); text-align: center; padding: var(--sp-6) var(--sp-3); font-size: var(--fs-20); margin: 0; }
	.ticket { display: grid; grid-template-rows: 1fr auto; min-height: 0; background: var(--c-arena); border-left: 1px solid var(--c-linea-fuerte); }
	.lineas { overflow-y: auto; padding: var(--sp-3); display: grid; gap: var(--sp-2); align-content: start; }
	.linea { background: var(--c-blanco); border-radius: var(--r-md); padding: var(--sp-2) var(--sp-3); display: grid; gap: var(--sp-2); }
	.desc { display: grid; grid-template-columns: 1fr auto; font-size: var(--fs-20); }
	.desc small { grid-column: 1; color: var(--c-texto-suave); font-size: var(--fs-14); }
	.imp { font-family: var(--f-titulo); font-weight: 700; grid-row: 1; grid-column: 2; }
	.cant { display: flex; align-items: center; gap: var(--sp-2); }
	.cant button { width: 64px; padding: 0; }
	.cant output { min-width: 56px; text-align: center; font: 700 var(--fs-32) var(--f-titulo); }
	.cant .quitar { margin-left: auto; color: var(--c-peligro); border-color: var(--c-peligro); }
	.pie { padding: var(--sp-3); display: grid; gap: var(--sp-2); border-top: 2px solid var(--c-linea-fuerte); }
	.total { display: flex; justify-content: space-between; align-items: baseline; font: 600 var(--fs-24) var(--f-titulo); }
	.total strong { font-size: var(--fs-56); line-height: 1; font-variant-numeric: tabular-nums; }
	.pagos, .efectivo { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: var(--sp-2); }
	.pagos button { font-size: var(--fs-16); flex-direction: column; gap: 2px; min-height: 64px; padding: 0; }
	.efectivo button { font-size: var(--fs-20); padding: 0; }
	.pagos button.on, .efectivo button.on { background: var(--c-bosque); color: var(--c-texto-inverso); border-color: var(--c-bosque); }
	.cambio { margin: 0; text-align: center; font: 700 var(--fs-32) var(--f-titulo); color: var(--c-listo); line-height: 1.1; }
	.cambio.falta { color: var(--c-peligro); }
	.err { margin: 0; background: var(--c-peligro); color: #fff; padding: var(--sp-3); border-radius: var(--r-md); font-size: var(--fs-18); font-weight: 600; display: flex; gap: var(--sp-2); align-items: center; }
	.acc { display: grid; grid-template-columns: 72px 1fr; gap: var(--sp-2); }
	.vaciar { padding: 0; min-height: 80px; }
	.cobrar { min-height: 80px; font-size: var(--fs-32); background: var(--c-barro); border-color: var(--c-barro); color: #fff; padding: 0 var(--sp-4); }
	.hoja { position: fixed; inset: 0; z-index: var(--z-modal); background: var(--c-papel); display: grid; grid-template-rows: auto 1fr auto; gap: var(--sp-4); padding: var(--sp-5); height: 100dvh; box-sizing: border-box; }
	.hoja header { display: flex; justify-content: space-between; align-items: center; }
	.hoja h2 { font: 700 var(--fs-40) var(--f-titulo); margin: 0; }
	.x { width: 72px; padding: 0; }
	.grupos { overflow-y: auto; display: grid; gap: var(--sp-5); align-content: start; }
	.etq { margin: 0 0 var(--sp-2); font: 600 var(--fs-20) var(--f-titulo); color: var(--c-texto-suave); }
	.opts { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--sp-3); }
	.opts button { min-height: 96px; font-size: var(--fs-24); flex-direction: column; gap: 0; }
	.opts button small { font-size: var(--fs-18); font-weight: 500; }
	.opts button.on { background: var(--c-hoja-fuerte); border-color: var(--c-hoja-fuerte); color: #fff; }
	.ok { min-height: 96px; font-size: var(--fs-32); background: var(--c-barro); border-color: var(--c-barro); color: #fff; }
	.pendientes { overflow-y: auto; display: grid; gap: var(--sp-3); align-content: start; }
	.pen { display: grid; grid-template-columns: 1fr auto 220px; gap: var(--sp-4); align-items: center; background: var(--c-blanco); border-radius: var(--r-md); padding: var(--sp-3) var(--sp-4); font-size: var(--fs-20); }
	.pen > div { display: grid; }
	.pen small { color: var(--c-texto-suave); font-size: var(--fs-16); }
	.tn { font: 700 var(--fs-32) var(--f-titulo); }
	.pen strong { font: 700 var(--fs-40) var(--f-titulo); }
	.conf { position: fixed; inset: 0; z-index: var(--z-aviso); border: 0; border-radius: 0; background: var(--c-listo); color: #fff; flex-direction: column; gap: var(--sp-2); font-size: var(--fs-40); }
	.conf small { font-size: var(--fs-32); letter-spacing: var(--ls-etiqueta); }
	.conf b { font: 800 clamp(160px, 30vh, 320px) / 1 var(--f-titulo); }
	.conf .imp { grid-column: auto; font-size: var(--fs-32); }
</style>
