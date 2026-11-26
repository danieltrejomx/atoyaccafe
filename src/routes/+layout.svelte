<script lang="ts">
	// Fuentes autoalojadas: el kiosco y la TV no dependen de internet para la letra.
	import '@fontsource-variable/outfit';
	import '@fontsource-variable/figtree';
	import '@fontsource/instrument-serif/400-italic.css';
	import '$lib/ui/tokens.css';

	let { children } = $props();
</script>

{@render children()}
