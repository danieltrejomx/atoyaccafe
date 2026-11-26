<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api';
	import { NOMBRE_CANAL, pesos } from '$lib/portal/acceso';
	import { crearStream } from '$lib/stream.svelte';
	import type { Pedido } from '$lib/types';

	// Checklists de apertura y cierre (simplificadas del portal anterior); se guardan por día en este navegador.
	const LISTAS = {
		Apertura: ['Revisar temperatura del refrigerador (4 °C o menos)', 'Recibir pan del día y revisar frescura', 'Verificar fondo de caja', 'Encender kiosco, TV de turnos y luces'],
		Cierre: ['Corte final de caja (efectivo y terminal)', 'Registrar merma del día', 'Limpieza de plancha, barra y piso', 'Etiquetar y refrigerar lo guardado', 'Pedir pan para mañana']
	};
	const clave = `atoyac_checklist_${new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })}`;
	let hechos = $state<Record<string, boolean>>({});
	let pedidos = $state<Pedido[]>([]);
	let error = $state('');

	const cargar = () => api.pedidos().then((r) => (pedidos = r), (e) => (error = e.message));
	const s = crearStream(
		{ 'pedido.creado': cargar, 'pedido.actualizado': cargar },
		{ alAbrir: cargar }
	);
	onMount(() => {
		try { hechos = JSON.parse(localStorage.getItem(clave) ?? '{}'); } catch { /* sin almacenamiento: queda en memoria */ }
		s.abrir();
		return s.cerrar;
	});
	function marcar(k: string) {
		hechos[k] = !hechos[k];
		try { localStorage.setItem(clave, JSON.stringify(hechos)); } catch { /* ignorar */ }
	}

	// Ventas = pedidos pagados y no cancelados.
	const ventas = $derived(pedidos.filter((p) => p.pagoEstado === 'pagado' && p.estado !== 'cancelado'));
	const suma = (l: Pedido[]) => l.reduce((a, p) => a + p.total, 0);
	const porCanal = $derived(Object.entries(Object.groupBy(ventas, (p) => p.canal)) as [keyof typeof NOMBRE_CANAL, Pedido[]][]);
	const porPago = $derived(Object.entries(Object.groupBy(ventas, (p) => p.pagoMetodo ?? 'pagado en la app')) as [string, Pedido[]][]);
</script>

<div class="pagina">
	<h1>Resumen de hoy</h1>
	{#if error}<p class="error" role="alert">{error}</p>{/if}
	<div class="panel">
		<p class="etiqueta">Ventas del día</p>
		<p class="gran">{pesos(suma(ventas))}</p>
		<p>{ventas.length} pedidos pagados · {pedidos.filter((p) => p.pagoEstado === 'pendiente' && p.estado !== 'cancelado').length} con pago pendiente · {pedidos.filter((p) => p.estado === 'cancelado').length} cancelados</p>
	</div>
	<div class="dos">
		<div class="panel">
			<p class="etiqueta">Por canal</p>
			<table><tbody>
				{#each porCanal as [c, l]}<tr><td>{NOMBRE_CANAL[c]}</td><td class="num">{l.length}</td><td class="num">{pesos(suma(l))}</td></tr>
				{:else}<tr><td class="vacio">Sin ventas todavía.</td></tr>{/each}
			</tbody></table>
		</div>
		<div class="panel">
			<p class="etiqueta">Por forma de pago</p>
			<table><tbody>
				{#each porPago as [m, l]}<tr><td>{m}</td><td class="num">{l.length}</td><td class="num">{pesos(suma(l))}</td></tr>
				{:else}<tr><td class="vacio">Sin ventas todavía.</td></tr>{/each}
			</tbody></table>
		</div>
	</div>
	<div class="dos">
		{#each Object.entries(LISTAS) as [titulo, items]}
			<div class="panel">
				<h2 style="margin-bottom: var(--sp-3)">{titulo}</h2>
				{#each items as t}
					<label class="fila"><input type="checkbox" checked={!!hechos[titulo + t]} onchange={() => marcar(titulo + t)} /> {t}</label>
				{/each}
			</div>
		{/each}
	</div>
</div>

<style>
	.gran { font: 700 var(--fs-56) var(--f-titulo); margin: var(--sp-2) 0; }
	.dos { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--sp-4); }
	input[type='checkbox'] { min-height: 0; width: 20px; height: 20px; }
</style>
