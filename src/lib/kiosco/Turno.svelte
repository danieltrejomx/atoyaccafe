<script lang="ts">
	import { onMount } from 'svelte';
	import type { Pedido } from '$lib/types';
	import Boton from '$lib/ui/Boton.svelte';
	import { hablar } from '$lib/turnos/anuncios';

	let { pedido, clabe, alTerminar }: { pedido: Pedido; clabe: string; alTerminar: () => void } = $props();

	onMount(() => {
		hablar('En breve tu turno aparecerá en pantalla. Recuerda regresar cubiertos y platos a la ventanilla. Gracias.');
	});
</script>

<div class="turno">
	<p class="etiqueta">Listo. Tu turno es el</p>
	<div class="numero" aria-label="Turno {pedido.turno}">{pedido.turno}</div>
	{#if pedido.pagoEstado === 'pendiente'}
		<p class="pago">Pasa a caja para pagar. Tu pedido entra a cocina en cuanto se confirme.</p>
		{#if pedido.pagoMetodo === 'transferencia' && clabe}
			<p class="clabe">CLABE <b>{clabe}</b></p>
		{/if}
	{/if}
	<p class="aviso">Te avisamos en la pantalla cuando esté listo.</p>
	<Boton variante="secundario" tamano="xl" onclick={alTerminar}>Terminar</Boton>
</div>

<style>
	.turno { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--sp-3); background: var(--c-arena); text-align: center; padding: var(--sp-5); }
	.etiqueta { margin: 0; font: 600 var(--fs-40) var(--f-titulo); text-transform: uppercase; letter-spacing: var(--ls-etiqueta); }
	.numero { font: 700 240px/1 var(--f-titulo); color: var(--c-hoja); animation: entra var(--dur-3) var(--ease-rebote); }
	p { margin: 0; font-size: var(--fs-24); }
	.pago { font-weight: 600; max-width: 720px; }
	.clabe { font-size: var(--fs-32); font-variant-numeric: tabular-nums; }
	.aviso { color: var(--c-texto-suave); margin-bottom: var(--sp-4); }
	@keyframes entra { from { transform: scale(0.7); opacity: 0; } }
</style>
