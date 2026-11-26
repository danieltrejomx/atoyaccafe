<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api';
	import AlertaStock from '$lib/portal/AlertaStock.svelte';
	import { crearStream } from '$lib/stream.svelte';
	import type { Insumo } from '$lib/types';

	let insumos = $state<Insumo[]>([]);
	let error = $state('');
	let abierto = $state<number | null>(null);
	let tipo = $state<'ajuste' | 'merma' | 'compra'>('ajuste');
	let cantidad = $state('');
	let nota = $state('');
	let minimo = $state('');

	const cargar = () => api.insumos().then((r) => (insumos = r), (e) => (error = e.message));
	const s = crearStream(
		{ 'insumo.actualizado': (i) => (insumos = insumos.map((x) => (x.id === i.id ? i : x))) },
		{ alAbrir: cargar }
	);
	onMount(() => (s.abrir(), s.cerrar));

	const ordenados = $derived([...insumos].sort((a, b) => +b.bajoMinimo - +a.bajoMinimo || a.nombre.localeCompare(b.nombre)));

	function abrir(i: Insumo) {
		abierto = abierto === i.id ? null : i.id;
		tipo = 'ajuste'; cantidad = ''; nota = ''; minimo = String(i.minimo); error = '';
	}
	async function guardar(i: Insumo) {
		const n = Number(cantidad);
		if (!n) return (error = 'Escribe una cantidad distinta de cero.');
		if (tipo === 'merma' && !nota.trim()) return (error = 'Indica el motivo de la merma.');
		try {
			await api.ajustarInsumo({ id: i.id, tipo, cantidad: tipo === 'ajuste' ? n : Math.abs(n), nota: nota.trim() || undefined });
			abierto = null; error = '';
		} catch (e) { error = (e as Error).message; }
	}
	async function guardarMinimo(i: Insumo) {
		try {
			await api.ajustarInsumo({ id: i.id, minimo: Number(minimo) });
			error = '';
		} catch (e) { error = (e as Error).message; }
	}
</script>

<div class="pagina">
	<h1>Insumos</h1>
	{#if error}<p class="error" role="alert">{error}</p>{/if}
	<div class="panel">
		<table>
			<thead><tr><th>Insumo</th><th class="num">Stock</th><th class="num">Mínimo</th><th>Estado</th><th></th></tr></thead>
			<tbody>
				{#each ordenados as i (i.id)}
					<tr class:bajo={i.bajoMinimo}>
						<td>{i.nombre}</td>
						<td class="num">{i.stock} {i.unidad}</td>
						<td class="num">{i.minimo}</td>
						<td>{#if i.bajoMinimo}<AlertaStock insumo={i} />{/if}</td>
						<td><button class="btn sec chico" onclick={() => abrir(i)} aria-expanded={abierto === i.id}>Ajustar</button></td>
					</tr>
					{#if abierto === i.id}
						<tr><td colspan="5">
							<form class="fila" onsubmit={(e) => (e.preventDefault(), guardar(i))}>
								<select bind:value={tipo} aria-label="Tipo de movimiento">
									<option value="ajuste">Ajuste (+ o −)</option>
									<option value="merma">Registrar merma</option>
									<option value="compra">Compra</option>
								</select>
								<input type="number" step="any" bind:value={cantidad} placeholder="Cantidad ({i.unidad})" aria-label="Cantidad" />
								<input bind:value={nota} placeholder={tipo === 'merma' ? 'Motivo (obligatorio)' : 'Nota'} aria-label="Motivo o nota" />
								<button class="btn chico" class:peligro={tipo === 'merma'}>Guardar</button>
							</form>
							<form class="fila" style="margin-top: var(--sp-2)" onsubmit={(e) => (e.preventDefault(), guardarMinimo(i))}>
								<label for="min{i.id}">Mínimo</label>
								<input id="min{i.id}" type="number" step="any" min="0" bind:value={minimo} />
								<button class="btn quieto chico">Guardar mínimo</button>
							</form>
						</td></tr>
					{/if}
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.bajo td:first-child { color: var(--c-peligro); font-weight: 700; }
	.bajo { background: var(--c-cancelado-bg); }
</style>
