<script lang="ts">
	import { esBebida, type Opcion, type Producto } from '$lib/types';
	import Boton from '$lib/ui/Boton.svelte';
	import Icono from '$lib/ui/Icono.svelte';

	let {
		producto,
		onagregar,
		oncerrar
	}: { producto: Producto | null; onagregar: (p: Producto, o: Opcion[], cantidad: number, notas: string) => void; oncerrar: () => void } = $props();

	let dlg: HTMLDialogElement;
	let elegidas = $state<number[]>([]);
	let cantidad = $state(1);
	let quitados = $state<string[]>([]);

	/** Ingredientes principales por categoría */
	const INGREDIENTES: Record<string, string[]> = {
		'Ensaladas': ['Lechuga', 'Espinaca', 'Tomate cherry', 'Zanahoria', 'Pepino', 'Aguacate', 'Panela', 'Crotones', 'Semilla de girasol'],
		'Chilaquiles': ['Totopos', 'Salsa verde', 'Crema', 'Queso', 'Cebolla', 'Aguacate', 'Frijoles', 'Cilantro'],
		'Molletes': ['Bolillo', 'Frijoles', 'Queso manchego', 'Pico de gallo'],
		'Chapatas': ['Pan', 'Panela', 'Queso manchego', 'Lechuga', 'Tomate', 'Mayonesa'],
		'Fruta': ['Manzana', 'Plátano', 'Yogurt', 'Granola', 'Miel'],
	};

	const ingredientes = $derived(INGREDIENTES[producto?.categoria ?? ''] ?? []);
	const notasTexto = $derived(quitados.length ? 'Sin ' + quitados.join(', ') : '');

	const grupos = $derived.by(() => {
		const m = new Map<string, Opcion[]>();
		for (const o of producto?.opciones ?? []) m.set(o.grupo, [...(m.get(o.grupo) ?? []), o]);
		return [...m];
	});
	const extras = $derived((producto?.opciones ?? []).filter((o) => elegidas.includes(o.id)));
	const total = $derived(((producto?.precio ?? 0) + extras.reduce((s, o) => s + o.precioExtra, 0)) * cantidad);

	$effect(() => {
		cantidad = 1;
		quitados = [];
		elegidas = grupos.flatMap(([, ops]) => (ops[0].tipo === 'unica' ? [(ops.find((o) => o.porDefecto) ?? ops[0]).id] : ops.filter((o) => o.porDefecto).map((o) => o.id)));
		if (producto && !dlg.open) dlg.showModal();
		else if (!producto && dlg.open) dlg.close();
	});

	function toggleIngrediente(ing: string) {
		quitados = quitados.includes(ing) ? quitados.filter(i => i !== ing) : [...quitados, ing];
	}

	function elegir(o: Opcion, ops: Opcion[]) {
		if (o.tipo === 'unica') elegidas = [...elegidas.filter((id) => !ops.some((x) => x.id === id)), o.id];
		else elegidas = elegidas.includes(o.id) ? elegidas.filter((id) => id !== o.id) : [...elegidas, o.id];
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog bind:this={dlg} onclick={(e) => e.target === dlg && oncerrar()} onclose={oncerrar} aria-label={producto?.nombre}>
	{#if producto}
		<button class="cerrar" aria-label="Cerrar" onclick={oncerrar}><Icono nombre="cerrar" /></button>
		<div class="cuerpo">
			<div class="foto">
				{#if producto.foto}<img src={producto.foto} alt="" />{:else}<Icono nombre={esBebida(producto.categoria) ? 'taza' : 'cubiertos'} tam={48} />{/if}
			</div>
			<div class="datos">
				<h2>{producto.nombre}</h2>
				<p>{producto.descripcion}</p>
				{#each grupos as [grupo, ops] (grupo)}
					<fieldset>
						<legend>{grupo}</legend>
						{#if ops[0].tipo === 'unica'}
							<div class="pildoras">
								{#each ops as o (o.id)}
									<button role="radio" aria-checked={elegidas.includes(o.id)} class:on={elegidas.includes(o.id)} onclick={() => elegir(o, ops)}>
										{o.nombre}{o.precioExtra ? ` +$${o.precioExtra}` : ''}
									</button>
								{/each}
							</div>
						{:else}
							{#each ops as o (o.id)}
								<button role="checkbox" aria-checked={elegidas.includes(o.id)} class="fila" onclick={() => elegir(o, ops)}>
									<span class="caja" class:on={elegidas.includes(o.id)}>{#if elegidas.includes(o.id)}<Icono nombre="check" tam={20} />{/if}</span>
									<span>{o.nombre}</span>
									{#if o.precioExtra}<span class="px">+${o.precioExtra}</span>{/if}
								</button>
							{/each}
						{/if}
					</fieldset>
				{/each}
				{#if ingredientes.length}
					<fieldset>
						<legend>Ingredientes <small>(desmarca lo que no quieras)</small></legend>
						<div class="ingredientes">
							{#each ingredientes as ing (ing)}
								<button
									role="checkbox"
									aria-checked={!quitados.includes(ing)}
									class="ing-pill"
									class:quitado={quitados.includes(ing)}
									onclick={() => toggleIngrediente(ing)}
								>
									{#if quitados.includes(ing)}✕{:else}✓{/if}
									{ing}
								</button>
							{/each}
						</div>
					</fieldset>
				{/if}
			</div>
		</div>
		<footer>
			<div class="cont">
				<button aria-label="Menos" disabled={cantidad <= 1} onclick={() => cantidad--}><Icono nombre="menos" /></button>
				<output>{cantidad}</output>
				<button aria-label="Más" onclick={() => (cantidad = Math.min(50, cantidad + 1))}><Icono nombre="mas" /></button>
			</div>
			<Boton tamano="xl" onclick={() => (onagregar(producto, extras, cantidad, notasTexto), oncerrar())}>Agregar al pedido · ${total}</Boton>
		</footer>
	{/if}
</dialog>

<style>
	dialog {
		width: 720px;
		max-width: calc(100vw - 32px);
		max-height: calc(100dvh - 32px);
		margin: auto;
		padding: 0;
		border: 0;
		border-radius: var(--r-lg);
		background: var(--c-papel);
		color: var(--c-texto);
		box-shadow: var(--sh-3);
		overflow: hidden;
	}
	dialog[open] { display: flex; flex-direction: column; animation: sube var(--dur-3) var(--ease-salida); }
	dialog::backdrop { background: rgba(31, 45, 36, 0.4); }
	@keyframes sube { from { transform: translateY(24px); opacity: 0; } }
	button { border: 0; background: transparent; color: inherit; cursor: pointer; touch-action: manipulation; font-family: inherit; }
	button:focus-visible { outline: none; box-shadow: var(--foco); }
	.cerrar { position: absolute; top: var(--sp-3); right: var(--sp-3); width: var(--toque-kiosco); height: var(--toque-kiosco); border-radius: 50%; display: grid; place-items: center; z-index: 1; }
	.cuerpo { display: grid; grid-template-columns: 220px 1fr; gap: var(--sp-5); padding: var(--sp-6); overflow-y: auto; }
	.foto { width: 220px; height: 220px; border-radius: 50%; background: var(--c-arena); color: var(--c-salvia); display: grid; place-items: center; overflow: hidden; box-shadow: var(--sh-2); }
	.foto img { width: 100%; height: 100%; object-fit: cover; }
	h2 { margin: 0 var(--sp-7) var(--sp-2) 0; font: 600 var(--fs-32) var(--f-titulo); }
	p { margin: 0 0 var(--sp-4); color: var(--c-texto-suave); }
	fieldset { border: 0; padding: 0; margin: 0 0 var(--sp-4); }
	legend { padding: 0; margin-bottom: var(--sp-2); font: 600 var(--fs-14) var(--f-titulo); text-transform: uppercase; letter-spacing: var(--ls-etiqueta); color: var(--c-texto-suave); }
	.pildoras { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
	.pildoras button { min-height: var(--toque-kiosco); padding: 0 20px; border-radius: var(--r-pill); border: 1.5px solid var(--c-linea-fuerte); font: 600 var(--fs-16) var(--f-texto); }
	.pildoras button.on { background: var(--c-hoja-fuerte); border-color: var(--c-hoja-fuerte); color: #fff; }
	.fila { display: flex; align-items: center; gap: var(--sp-3); width: 100%; min-height: var(--toque-kiosco); text-align: left; font-size: var(--fs-16); }
	.caja { width: 32px; height: 32px; border-radius: var(--r-sm); border: 2px solid var(--c-linea-fuerte); display: grid; place-items: center; }
	.caja.on { background: var(--c-hoja-fuerte); border-color: var(--c-hoja-fuerte); color: #fff; }
	.px { margin-left: auto; font-weight: 600; font-variant-numeric: tabular-nums; }
	legend small { font-weight: 400; color: var(--c-texto-suave); text-transform: none; letter-spacing: 0; }
	.ingredientes { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
	.ing-pill { min-height: 40px; padding: 0 14px; border-radius: var(--r-pill); border: 1.5px solid var(--c-hoja-fuerte); background: var(--c-hoja-fuerte); color: #fff; font: 600 var(--fs-14) var(--f-texto); display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s; }
	.ing-pill.quitado { background: var(--c-blanco); color: var(--c-cancelado); border-color: var(--c-cancelado); text-decoration: line-through; opacity: 0.7; }
	footer { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-4); padding: var(--sp-4) var(--sp-6); border-top: 1px solid var(--c-linea); }
	.cont { display: flex; align-items: center; gap: var(--sp-2); }
	.cont button { width: var(--toque-kiosco); height: var(--toque-kiosco); border-radius: 50%; background: var(--c-arena); display: grid; place-items: center; }
	.cont button:disabled { opacity: 0.45; }
	output { min-width: 32px; text-align: center; font: 600 var(--fs-24) var(--f-titulo); font-variant-numeric: tabular-nums; }
</style>
