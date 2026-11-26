<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api';
	import { CATEGORIAS, type Insumo, type Producto } from '$lib/types';

	// Hoja tipo Excel: una fila = un insumo de la receta base o de una opción de un producto.
	type Fila = { key: number; productoId: number; opcionId: number | null; insumoId: number; cantidad: number };
	let productos = $state<Producto[]>([]);
	let insumos = $state<Insumo[]>([]);
	let filas = $state<Fila[]>([]);
	let sucios = $state(new Set<number>());
	let cargando = $state(true);
	let guardando = $state(false);
	let error = $state('');
	let aviso = $state('');
	let buscar = $state('');
	let categoria = $state('');
	let seq = 0;

	const prodPor = $derived(new Map(productos.map((p) => [p.id, p])));
	const insPor = $derived(new Map(insumos.map((i) => [i.id, i])));
	const parte = (f: Fila) => (f.opcionId === null ? 'Base' : (prodPor.get(f.productoId)?.opciones.find((o) => o.id === f.opcionId)?.nombre ?? '?'));
	const visibles = $derived(
		filas.filter((f) => {
			const p = prodPor.get(f.productoId);
			if (!p || (categoria && p.categoria !== categoria)) return false;
			const q = buscar.trim().toLowerCase();
			return !q || `${p.nombre} ${parte(f)} ${insPor.get(f.insumoId)?.nombre ?? ''}`.toLowerCase().includes(q);
		})
	);

	onMount(cargar);
	async function cargar() {
		cargando = true; error = '';
		try {
			[productos, insumos] = await Promise.all([api.productos(true), api.insumos()]);
			const recetas = await Promise.all(productos.map((p) => api.receta(p.id)));
			filas = recetas.flatMap((r) => [
				...r.base.map((l) => ({ key: seq++, productoId: r.productoId, opcionId: null, ...l })),
				...r.opciones.flatMap((o) => o.lineas.map((l) => ({ key: seq++, productoId: r.productoId, opcionId: o.opcionId, ...l })))
			]);
			sucios = new Set();
		} catch (e) { error = (e as Error).message; }
		cargando = false;
	}

	const marcar = (productoId: number) => { sucios = new Set(sucios).add(productoId); aviso = ''; };
	function quitar(f: Fila) { filas = filas.filter((x) => x.key !== f.key); marcar(f.productoId); }
	function duplicar(f: Fila) {
		const i = filas.findIndex((x) => x.key === f.key);
		filas.splice(i + 1, 0, { ...f, key: seq++, insumoId: insumos[0]?.id ?? f.insumoId, cantidad: 0 });
		marcar(f.productoId);
	}

	// Fila nueva
	let nProd = $state<number | null>(null);
	let nOpcion = $state<number | null>(null);
	let nInsumo = $state<number | null>(null);
	let nCant = $state<number | null>(null);
	function agregar() {
		if (nProd === null || nInsumo === null || !nCant) return;
		filas.push({ key: seq++, productoId: nProd, opcionId: nOpcion, insumoId: nInsumo, cantidad: nCant });
		marcar(nProd);
		nInsumo = null; nCant = null;
	}

	async function guardar() {
		guardando = true; error = '';
		try {
			for (const id of sucios) {
				const mias = filas.filter((f) => f.productoId === id && f.cantidad > 0);
				const linea = (f: Fila) => ({ insumoId: f.insumoId, cantidad: f.cantidad });
				const ops = new Map<number, ReturnType<typeof linea>[]>();
				for (const f of mias) if (f.opcionId !== null) ops.set(f.opcionId, [...(ops.get(f.opcionId) ?? []), linea(f)]);
				await api.guardarReceta(id, {
					base: mias.filter((f) => f.opcionId === null).map(linea),
					opciones: [...ops].map(([opcionId, lineas]) => ({ opcionId, lineas }))
				});
			}
			aviso = `${sucios.size} receta(s) guardada(s).`;
			sucios = new Set();
		} catch (e) { error = (e as Error).message; }
		guardando = false;
	}

	function csv() {
		const q = (v: unknown) => `"${String(v).replaceAll('"', '""')}"`;
		const txt = [['Categoría', 'Producto', 'Parte', 'Insumo', 'Cantidad', 'Unidad'], ...filas.map((f) => {
			const p = prodPor.get(f.productoId)!, i = insPor.get(f.insumoId);
			return [p.categoria, p.nombre, parte(f), i?.nombre, f.cantidad, i?.unidad];
		})].map((r) => r.map(q).join(',')).join('\n');
		const a = document.createElement('a');
		a.href = URL.createObjectURL(new Blob(['﻿' + txt], { type: 'text/csv' }));
		a.download = 'recetas-atoyac.csv';
		a.click();
	}
	const nuevaProd = $derived(nProd === null ? undefined : prodPor.get(nProd));
</script>

<div class="pagina hoja">
	<div class="cabeza">
		<h1>Recetas</h1>
		<input type="search" placeholder="Buscar producto o insumo" bind:value={buscar} aria-label="Buscar" />
		<select bind:value={categoria} aria-label="Categoría">
			<option value="">Todas las categorías</option>
			{#each CATEGORIAS as c}<option value={c}>{c}</option>{/each}
		</select>
		<button class="btn sec" onclick={csv} disabled={cargando}>Descargar CSV</button>
		<button class="btn" onclick={guardar} disabled={!sucios.size || guardando}>
			{guardando ? 'Guardando…' : sucios.size ? `Guardar cambios (${sucios.size})` : 'Sin cambios'}
		</button>
	</div>
	{#if error}<p class="error" role="alert">{error}</p>{/if}
	{#if aviso}<p role="status" class="ok">{aviso}</p>{/if}

	{#if cargando}
		<p>Cargando recetas…</p>
	{:else}
		<div class="tabla">
			<table>
				<thead>
					<tr><th>Categoría</th><th>Producto</th><th>Parte</th><th>Insumo</th><th class="num">Cantidad</th><th>Unidad</th><th></th></tr>
				</thead>
				<tbody>
					{#each visibles as f, i (f.key)}
						{@const p = prodPor.get(f.productoId)!}
						{@const primera = i === 0 || visibles[i - 1].productoId !== f.productoId}
						<tr class:primera class:sucio={sucios.has(f.productoId)}>
							<td class="suave">{primera ? p.categoria : ''}</td>
							<td class="prod">{primera ? p.nombre : ''}</td>
							<td class="suave">{parte(f)}</td>
							<td>
								<select bind:value={f.insumoId} onchange={() => marcar(f.productoId)} aria-label="Insumo">
									{#each insumos as ins}<option value={ins.id}>{ins.nombre}</option>{/each}
								</select>
							</td>
							<td class="num"><input type="number" min="0" step="any" bind:value={f.cantidad} oninput={() => marcar(f.productoId)} aria-label="Cantidad" /></td>
							<td class="suave">{insPor.get(f.insumoId)?.unidad}</td>
							<td class="acciones">
								<button class="mini" onclick={() => duplicar(f)} title="Agregar insumo debajo" aria-label="Agregar insumo debajo">+</button>
								<button class="mini rojo" onclick={() => quitar(f)} title="Quitar" aria-label="Quitar">×</button>
							</td>
						</tr>
					{:else}
						<tr><td colspan="7" class="suave">Sin filas para este filtro.</td></tr>
					{/each}
				</tbody>
				<tfoot>
					<tr>
						<td colspan="2">
							<select bind:value={nProd} onchange={() => (nOpcion = null)} aria-label="Producto nuevo">
								<option value={null}>+ Producto…</option>
								{#each productos as p}<option value={p.id}>{p.nombre}</option>{/each}
							</select>
						</td>
						<td>
							<select bind:value={nOpcion} aria-label="Parte" disabled={!nuevaProd}>
								<option value={null}>Base</option>
								{#each nuevaProd?.opciones ?? [] as o}<option value={o.id}>{o.nombre}</option>{/each}
							</select>
						</td>
						<td>
							<select bind:value={nInsumo} aria-label="Insumo nuevo">
								<option value={null}>Insumo…</option>
								{#each insumos as ins}<option value={ins.id}>{ins.nombre}</option>{/each}
							</select>
						</td>
						<td class="num"><input type="number" min="0" step="any" placeholder="0" bind:value={nCant} aria-label="Cantidad nueva" /></td>
						<td class="suave">{nInsumo === null ? '' : insPor.get(nInsumo)?.unidad}</td>
						<td><button class="btn chico" onclick={agregar} disabled={nProd === null || nInsumo === null || !nCant}>Agregar</button></td>
					</tr>
				</tfoot>
			</table>
		</div>
		<p class="suave nota">Cantidades por pieza vendida, en unidades que se cuentan (rebanadas, rodajas, piezas, cucharadas; 0.5 = medio). "Base" se descuenta siempre; una opción solo si el cliente la elige. Las filas en amarillo tienen cambios sin guardar.</p>
	{/if}
</div>

<style>
	.hoja { display: grid; gap: var(--sp-3); }
	.cabeza { display: flex; flex-wrap: wrap; gap: var(--sp-3); align-items: center; }
	.cabeza h1 { margin: 0 auto 0 0; }
	.cabeza input, .cabeza select { min-height: 44px; }
	.tabla { overflow: auto; max-height: calc(100dvh - 220px); border: 1px solid var(--c-linea); border-radius: var(--r-md); background: var(--c-blanco); }
	table { border-collapse: collapse; width: 100%; font-size: var(--fs-14); }
	th { position: sticky; top: 0; z-index: 1; background: var(--c-arena, #efe9df); text-align: left; padding: 8px 10px; font: 600 var(--fs-12) var(--f-titulo); text-transform: uppercase; letter-spacing: var(--ls-etiqueta); border-bottom: 1px solid var(--c-linea-fuerte); }
	td { padding: 2px 10px; border-bottom: 1px solid var(--c-linea); height: 40px; }
	tr.primera td { border-top: 2px solid var(--c-linea-fuerte); }
	tr.sucio { background: #fff7dc; }
	tbody tr:hover { background: color-mix(in srgb, var(--c-salvia-claro) 40%, transparent); }
	.prod { font-weight: 600; }
	.suave { color: var(--c-texto-suave); }
	.num { text-align: right; width: 120px; }
	td select, td input { width: 100%; min-height: 34px; border: 1px solid transparent; background: transparent; font: inherit; padding: 0 6px; border-radius: 6px; }
	td select:hover, td input:hover, td select:focus, td input:focus { border-color: var(--c-linea-fuerte); background: var(--c-blanco); }
	td input[type='number'] { text-align: right; font-variant-numeric: tabular-nums; }
	tfoot td { position: sticky; bottom: 0; background: var(--c-papel, #f6f3ee); border-top: 2px solid var(--c-linea-fuerte); padding: 8px 10px; }
	tfoot select, tfoot input { border-color: var(--c-linea-fuerte); background: var(--c-blanco); }
	.acciones { white-space: nowrap; width: 80px; }
	.mini { width: 30px; height: 30px; border-radius: 6px; border: 1px solid var(--c-linea-fuerte); background: var(--c-blanco); cursor: pointer; font-size: 18px; line-height: 1; }
	.mini.rojo { color: var(--c-cancelado); }
	.ok { color: var(--c-hoja); font-weight: 600; }
	.nota { font-size: var(--fs-14); margin: 0; }
</style>
