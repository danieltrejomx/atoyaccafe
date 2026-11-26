<script lang="ts">
	import '$lib/sitio/sitio.css';
	import Cabecera from '$lib/sitio/Cabecera.svelte';
	import Pie from '$lib/sitio/Pie.svelte';

	let { children } = $props();
</script>

<div class="sitio">
	<a class="sr" href="#contenido">Saltar al contenido</a>
	<Cabecera />
	<main id="contenido">{@render children()}</main>
	<Pie />
</div>
