<script lang="ts">
	// Captura a mano de un pedido: mostrador (caja) o apps de reparto mientras no hay credenciales.
	import { onMount } from 'svelte';
	import { api } from '$lib/api';
	import { CATEGORIAS, PAGO_METODOS, type Canal, type PagoMetodo, type Producto } from '$lib/types';
	import { NOMBRE_CANAL, pesos } from './acceso';
	import Icono from './Icono.svelte';

	let { canal, onCreado }: { canal: Canal; onCreado?: () => void } = $props();
	// Las apps cobran por su cuenta; solo mostrador y kiosco eligen forma de pago.
	const local = $derived(canal === 'interno' || canal === 'kiosco');

	let productos = $state<Producto[] | null>(null);
	let cant = $state<Record<number, number>>({});
	let cliente = $state('');
	let externo = $state('');
	let notas = $state('');
	let pago = $state<PagoMetodo>('efectivo');
	let error = $state('');
	let enviando = $state(false);

	onMount(() => api.productos().then((r) => (productos = r), (e) => (error = e.message)));

	const items = $derived(Object.entries(cant).filter(([, n]) => n > 0).map(([id, n]) => ({ productoId: +id, cantidad: n, opcionIds: [] })));
	const total = $derived(items.reduce((s, i) => s + i.cantidad * (productos?.find((p) => p.id === i.productoId)?.precio ?? 0), 0));
	const cambiar = (id: number, d: number) => (cant[id] = Math.max(0, Math.min(50, (cant[id] ?? 0) + d)));

	async function crear(e: Event) {
		e.preventDefault();
		if (!items.length) return (error = 'Agrega al menos un producto.');
		enviando = true;
		error = '';
		try {
			await api.crearPedido({
				canal,
				items,
				cliente: cliente.trim() || undefined,
				notas: notas.trim() || undefined,
				externoId: !local && externo.trim() ? `${canal}:${externo.trim()}` : undefined,
				pagoMetodo: local ? pago : undefined
			});
			onCreado?.();
		} catch (e) {
			error = (e as Error).message;
		} finally {
			enviando = false;
		}
	}
</script>

<form onsubmit={crear}>
	{#if !productos}
		<p class="vacio">{error ? 'No se pudo cargar el menú. Cierra y vuelve a intentar.' : 'Cargando menú…'}</p>
	{:else}
		<div class="lista">
			{#each CATEGORIAS as c}
				{@const grupo = productos.filter((p) => p.categoria === c)}
				{#if grupo.length}
					<p class="etiqueta">{c}</p>
					{#each grupo as p (p.id)}
						<div class="prod" class:agotado={!p.disponible}>
							<span>{p.nombre}{#if !p.disponible} <em>Agotado</em>{/if}</span>
							<span class="num">{pesos(p.precio)}</span>
							<button type="button" class="cta" aria-label="Quitar uno de {p.nombre}" disabled={!cant[p.id]} onclick={() => cambiar(p.id, -1)}><Icono nombre="menos" /></button>
							<output>{cant[p.id] ?? 0}</output>
							<button type="button" class="cta" aria-label="Agregar uno de {p.nombre}" disabled={!p.disponible} onclick={() => cambiar(p.id, 1)}><Icono nombre="plus" /></button>
						</div>
					{/each}
				{/if}
			{/each}
		</div>
		<div class="campos">
			<label>Cliente (opcional)<input bind:value={cliente} maxlength="60" autocomplete="off" /></label>
			{#if local}
				<label>Forma de pago
					<select bind:value={pago}>{#each ['efectivo', 'tarjeta'] as m}<option value={m}>{m[0].toUpperCase() + m.slice(1)}</option>{/each}</select>
				</label>
			{:else}
				<label>Número de pedido en {NOMBRE_CANAL[canal]}<input bind:value={externo} maxlength="80" autocomplete="off" /></label>
			{/if}
			<label class="ancho">Notas (opcional)<input bind:value={notas} maxlength="300" autocomplete="off" /></label>
		</div>
		{#if error}<p class="error" role="alert">{error}</p>{/if}
		<div class="pie">
			<span class="total">Total <strong>{pesos(total)}</strong></span>
			<button class="btn" disabled={enviando || !items.length}>{enviando ? 'Procesando…' : 'Crear pedido'}</button>
		</div>
	{/if}
</form>

<style>
	form { display: grid; gap: var(--sp-4); margin-top: var(--sp-4); }
	.lista { max-height: 44vh; overflow-y: auto; background: var(--c-blanco); border-radius: var(--r-md); padding: var(--sp-2) var(--sp-4) var(--sp-3); }
	.etiqueta { margin: var(--sp-4) 0 var(--sp-1); }
	.prod { display: grid; grid-template-columns: 1fr auto var(--toque) 28px var(--toque); gap: var(--sp-2); align-items: center; min-height: 52px; border-bottom: 1px solid var(--c-linea); }
	.prod.agotado { color: var(--c-texto-suave); }
	em { font-style: normal; font-size: var(--fs-14); color: var(--c-cancelado); font-weight: 600; margin-left: var(--sp-2); }
	.num, output, strong { font-family: var(--f-titulo); font-weight: 600; font-variant-numeric: tabular-nums; }
	output { text-align: center; }
	.cta { width: var(--toque); height: var(--toque); border-radius: 50%; border: 1px solid var(--c-linea-fuerte); background: var(--c-papel); color: var(--c-texto); cursor: pointer; display: grid; place-items: center; }
	.cta:disabled { opacity: .45; cursor: not-allowed; }
	.cta:focus-visible { outline: none; box-shadow: var(--foco); }
	.campos { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-3); }
	label { display: grid; gap: var(--sp-1); font-weight: 600; font-size: var(--fs-14); }
	.ancho { grid-column: 1 / -1; }
	.pie { display: flex; justify-content: space-between; align-items: center; }
	.total { font-size: var(--fs-18); }
	.total strong { font-size: var(--fs-32); margin-left: var(--sp-2); }
</style>
