<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { ApiFallo, api } from '$lib/api';
	import TecladoPin from '$lib/portal/TecladoPin.svelte';

	let pin = $state('');
	let error = $state('');
	let cargando = $state(false);

	async function entrar() {
		if (pin.length < 4 || cargando) return;
		cargando = true;
		error = '';
		try {
			await api.login(pin);
			const next = page.url.searchParams.get('next') ?? '';
			await goto(next.startsWith('/portal') ? next : '/portal', { invalidateAll: true });
		} catch (e) {
			error = e instanceof ApiFallo && e.status === 429 ? 'Demasiados intentos. Espera 1 minuto.' : 'PIN incorrecto. Intenta otra vez.';
			pin = '';
		} finally {
			cargando = false;
		}
	}
</script>

<main>
	<h1>Escribe tu PIN</h1>
	<TecladoPin bind:pin alCompletar={entrar} />
	{#if error}<p class="error" role="alert">{error}</p>{/if}
	<button class="btn lg" onclick={entrar} disabled={pin.length < 4 || cargando}>{cargando ? 'Procesando…' : 'Entrar'}</button>
</main>

<style>
	main { min-height: 100vh; display: grid; place-content: center; justify-items: center; gap: var(--sp-3); padding: var(--sp-5); text-align: center; }
	h1 { font-size: var(--fs-32); }
	.btn { min-width: 216px; margin-top: var(--sp-3); }
</style>
