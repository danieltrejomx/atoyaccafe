<script lang="ts">
	import type { Insumo } from '$lib/types';
	import Icono from './Icono.svelte';

	let { lineas = $bindable(), insumos }: { lineas: { insumoId: number; cantidad: number }[]; insumos: Insumo[] } = $props();
	const unidad = (id: number) => insumos.find((i) => i.id === id)?.unidad ?? '';
</script>

{#each lineas as l, k}
	<div class="fila">
		<select bind:value={l.insumoId} aria-label="Insumo">
			{#each insumos as i}<option value={i.id}>{i.nombre}</option>{/each}
		</select>
		<input type="number" step="any" min="0" bind:value={l.cantidad} aria-label="Cantidad" style="width: 100px" />
		<span>{unidad(l.insumoId)}</span>
		<button type="button" class="btn quieto chico" aria-label="Quitar línea" onclick={() => lineas.splice(k, 1)}><Icono nombre="x" /></button>
	</div>
{/each}
<button type="button" class="btn sec chico" onclick={() => lineas.push({ insumoId: insumos[0]?.id, cantidad: 1 })}><Icono nombre="plus" /> Agregar insumo</button>
