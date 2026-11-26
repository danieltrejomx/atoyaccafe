<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api';
	import Lineas from '$lib/portal/Lineas.svelte';
	import type { Insumo, Producto } from '$lib/types';

	type L = { insumoId: number; cantidad: number };
	let productos = $state<Producto[]>([]);
	let insumos = $state<Insumo[]>([]);
	let sel = $state<number | null>(null);
	let base = $state<L[]>([]);
	let porOpcion = $state<Record<number, L[]>>({});
	let error = $state('');
	let ok = $state(false);

	const prod = $derived(productos.find((p) => p.id === sel));

	onMount(() =>
		void Promise.all([api.productos(true), api.insumos()]).then(
			([p, i]) => ((productos = p), (insumos = i)),
			(e) => (error = e.message)
		)
	);

	async function elegir() {
		ok = false; error = '';
		if (sel === null) return;
		try {
			const r = await api.receta(sel);
			base = r.base;
			porOpcion = Object.fromEntries((prod?.opciones ?? []).map((o) => [o.id, r.opciones.find((x) => x.opcionId === o.id)?.lineas ?? []]));
		} catch (e) { error = (e as Error).message; }
	}
	async function guardar() {
		try {
			await api.guardarReceta(sel!, {
				base: $state.snapshot(base),
				opciones: Object.entries(porOpcion).filter(([, l]) => l.length).map(([id, lineas]) => ({ opcionId: Number(id), lineas: $state.snapshot(lineas) }))
			});
			ok = true; error = '';
		} catch (e) { error = (e as Error).message; }
	}
</script>

<div class="pagina">
	<h1>Recetas</h1>
	<select bind:value={sel} onchange={elegir} aria-label="Producto">
		<option value={null}>Elige un producto</option>
		{#each productos as p}<option value={p.id}>{p.categoria}: {p.nombre}</option>{/each}
	</select>
	{#if error}<p class="error" role="alert">{error}</p>{/if}
	{#if prod}
		<div class="panel" style="display: grid; gap: var(--sp-3)">
			<h2>{prod.nombre}</h2>
			<p class="etiqueta">Receta base (por pieza)</p>
			<Lineas bind:lineas={base} {insumos} />
			{#each prod.opciones as o (o.id)}
				<p class="etiqueta">{o.grupo}: {o.nombre}</p>
				<Lineas bind:lineas={porOpcion[o.id]} {insumos} />
			{/each}
			<div class="fila">
				<button class="btn" onclick={guardar}>Guardar receta</button>
				{#if ok}<span role="status">Receta guardada.</span>{/if}
			</div>
		</div>
	{/if}
</div>
