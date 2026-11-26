<script lang="ts">
	import Boton from '$lib/ui/Boton.svelte';
	import Icono from '$lib/ui/Icono.svelte';
	import Teclado from './Teclado.svelte';

	let { alEnviar, alOmitir }: { alEnviar: (telefono: string) => Promise<string | null>; alOmitir: () => void } = $props();
	let tel = $state('');
	let enviando = $state(false);
	let error = $state('');

	async function enviar() {
		enviando = true;
		error = (await alEnviar(tel)) ?? '';
		enviando = false;
	}
</script>

<div class="ticket">
	<Icono nombre="whatsapp" tam={48} />
	<h1>¿Te mandamos tu ticket por WhatsApp?</h1>
	<output aria-live="polite" class:vacio={!tel}>{tel.replace(/(\d{2})(\d{4})?(\d{4})?/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' ')) || 'Tu número a 10 dígitos'}</output>
	<Teclado bind:valor={tel} />
	{#if error}<p role="alert">{error}</p>{/if}
	<div class="acciones">
		<Boton variante="primario" tamano="xl" disabled={tel.length !== 10} cargando={enviando} onclick={enviar}>Sí, enviarlo</Boton>
		<Boton variante="secundario" tamano="xl" onclick={alOmitir}>No, gracias</Boton>
	</div>
</div>

<style>
	.ticket { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--sp-4); background: var(--c-arena); color: var(--c-hoja); }
	h1 { margin: 0; color: var(--c-bosque); font: 600 var(--fs-40) var(--f-titulo); text-align: center; }
	output { height: 56px; font: 600 var(--fs-40) var(--f-titulo); font-variant-numeric: tabular-nums; color: var(--c-bosque); letter-spacing: 0.05em; }
	output { min-width: 300px; text-align: center; }
	output.vacio { font-size: var(--fs-24); font-weight: 400; font-family: var(--f-texto); letter-spacing: 0; color: var(--c-texto-suave); line-height: 56px; }
	p { margin: 0; color: var(--c-peligro); font-weight: 600; }
	.acciones { display: flex; gap: var(--sp-4); margin-top: var(--sp-3); }
</style>
