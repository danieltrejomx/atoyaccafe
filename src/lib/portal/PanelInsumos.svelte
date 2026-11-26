<script lang="ts">
	// Insumos siempre a la vista junto a los pedidos (solo lectura; los ajustes viven en /portal/insumos).
	import { onMount } from 'svelte';
	import { api } from '$lib/api';
	import { crearStream } from '$lib/stream.svelte';
	import type { Insumo } from '$lib/types';
	import Icono from './Icono.svelte';

	let { editable = false }: { editable?: boolean } = $props();
	let insumos = $state<Insumo[]>([]);
	let fallo = $state(false);
	let buscar = $state('');
	let tocado = $state<number | null>(null);

	const cargar = () => api.insumos().then((r) => ((insumos = r), (fallo = false)), () => (fallo = true));
	const s = crearStream(
		{
			'insumo.actualizado': (i) => {
				insumos = insumos.map((x) => (x.id === i.id ? i : x));
				tocado = i.id;
			}
		},
		{ alAbrir: cargar }
	);
	onMount(() => (s.abrir(), s.cerrar));

	const bajos = $derived(insumos.filter((i) => i.bajoMinimo).length);
	const lista = $derived(
		insumos
			.filter((i) => i.nombre.toLowerCase().includes(buscar.trim().toLowerCase()))
			.sort((a, b) => +b.bajoMinimo - +a.bajoMinimo || a.nombre.localeCompare(b.nombre, 'es'))
	);
	// Barra: stock sobre el doble del mínimo. Rojo debajo, ámbar hasta 20% arriba, verde después.
	const nivel = (i: Insumo) => Math.max(0, Math.min(100, i.minimo > 0 ? (i.stock / (i.minimo * 2)) * 100 : 100));
	const tono = (i: Insumo) => (i.bajoMinimo || i.stock <= 0 ? 'rojo' : i.stock <= i.minimo * 1.2 ? 'ambar' : 'verde');
</script>

<aside aria-label="Insumos">
	<header>
		<h2 class="etiqueta">Insumos</h2>
		{#if editable}<a href="/portal/insumos">Ajustar</a>{/if}
	</header>
	{#if bajos}
		<p class="banda" role="status"><Icono nombre="alerta" tam={16} /> {bajos === 1 ? '1 insumo' : `${bajos} insumos`} por debajo del mínimo</p>
	{/if}
	<input type="search" placeholder="Buscar insumo" aria-label="Buscar insumo" bind:value={buscar} />
	{#if fallo}
		<p class="vacio">No se pudieron cargar los insumos.</p>
	{:else if !lista.length}
		<p class="vacio">{insumos.length ? 'Ningún insumo con ese nombre.' : 'Sin insumos registrados.'}</p>
	{:else}
		<ul>
			{#each lista as i (i.id)}
				<li class={tono(i)} class:tocado={tocado === i.id} onanimationend={() => (tocado = null)}>
					<div class="fila">
						<span class="nombre">{#if tono(i) === 'rojo'}<Icono nombre="alerta" tam={16} />{/if}{i.nombre}</span>
						<span class="cifra">{#if i.stock <= 0}<b>Agotado</b>{:else}{i.stock} / {i.minimo} {i.unidad}{/if}</span>
					</div>
					<div class="barra"><span style="width: {nivel(i)}%"></span></div>
				</li>
			{/each}
		</ul>
	{/if}
</aside>

<style>
	aside { background: var(--c-blanco); border-left: 1px solid var(--c-linea); padding: var(--sp-4); display: flex; flex-direction: column; gap: var(--sp-3); min-height: 0; }
	header { display: flex; justify-content: space-between; align-items: center; min-height: var(--toque); }
	h2 { font-size: var(--fs-16) !important; color: var(--c-hoja) !important; }
	a { color: var(--c-hoja); font: 600 var(--fs-14) var(--f-titulo); padding: var(--sp-3) 0; }
	.banda { margin: 0; min-height: var(--toque); display: flex; align-items: center; gap: var(--sp-2); padding: 0 var(--sp-3); border-radius: var(--r-sm); background: var(--c-peligro); color: #fff; font-weight: 600; font-size: var(--fs-14); }
	ul { list-style: none; margin: 0; padding: 0; overflow-y: auto; flex: 1; }
	li { padding: var(--sp-3) var(--sp-2); border-bottom: 1px solid var(--c-linea); display: grid; gap: var(--sp-2); }
	li.rojo { background: var(--c-cancelado-bg); }
	li.tocado { animation: parpadeo var(--dur-4) 1; }
	@keyframes parpadeo { 50% { background: var(--c-salvia-claro); } }
	.fila { justify-content: space-between; flex-wrap: nowrap !important; }
	.nombre { font-weight: 600; display: inline-flex; gap: var(--sp-1); align-items: center; }
	.rojo .nombre { color: var(--c-cancelado); }
	.cifra { font-size: var(--fs-14); color: var(--c-texto-suave); font-variant-numeric: tabular-nums; white-space: nowrap; }
	.rojo .cifra { color: var(--c-cancelado); }
	.barra { height: 6px; border-radius: var(--r-pill); background: var(--c-arena); overflow: hidden; }
	.barra span { display: block; height: 100%; border-radius: inherit; background: var(--c-listo); }
	.ambar .barra span { background: var(--c-preparando); }
	.rojo .barra span { background: var(--c-peligro); }
	.vacio { padding: var(--sp-5) 0 !important; }
</style>
