<!-- TODO (builder canales): formulario "Capturar pedido" para DIDI/RAPPI/UBER mientras llegan las credenciales.
     El portal lo importa: <CapturaManual canal="didi" onCreado={...} />. Usa api.crearPedido. -->
<script lang="ts">
	import type { Canal } from '$lib/types';

	let { canal, onCreado }: { canal: Canal; onCreado?: () => void } = $props();
</script>

<p data-canal={canal} data-oncreado={!!onCreado}>Capturar pedido ({canal})</p>
