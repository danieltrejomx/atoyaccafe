<script lang="ts">
	import Icono from '$lib/sitio/Icono.svelte';
	import Seo from '$lib/sitio/Seo.svelte';
	import { pesos } from '$lib/sitio/negocio';
	import { enlacePedido, totalLineas, type Datos } from '$lib/sitio/pedido';
	import { CATEGORIAS } from '$lib/types';

	let { data } = $props();
	// Pedido por WhatsApp: el canal 'interno' de la API pide sesión, así que aquí solo se arma el mensaje.
	const disponibles = $derived((data.productos ?? []).filter((p) => p.disponible));
	let cantidades = $state<Record<number, number>>({});
	let d = $state<Datos>({ nombre: '', modo: 'recoger', direccion: '', nota: '' });
	let intento = $state(false);

	const lineas = $derived(disponibles.filter((p) => cantidades[p.id] > 0).map((p) => ({ nombre: p.nombre, precio: p.precio, cantidad: cantidades[p.id] })));
	const total = $derived(totalLineas(lineas));
	const cuantos = $derived(lineas.reduce((s, l) => s + l.cantidad, 0));
	const falta = $derived(!lineas.length ? 'Elige al menos un producto.' : !d.nombre.trim() ? 'Escribe tu nombre.' : d.modo === 'domicilio' && !d.direccion.trim() ? 'Escribe la dirección de entrega.' : '');
	const cambiar = (id: number, n: number) => (cantidades[id] = Math.max(0, Math.min(20, (cantidades[id] ?? 0) + n)));

	function enviar(e: Event) {
		e.preventDefault();
		intento = true;
		if (!falta) window.open(enlacePedido(lineas, d), '_blank', 'noopener');
	}
</script>

<Seo titulo="Pedir a domicilio" descripcion="Pide sin comisiones, a precio de mostrador. Recoge en barra o recibe en Santa Cruz Atoyac. Tu pedido se confirma por WhatsApp." />

<section class="seccion">
	<div class="contenedor">
		<p class="etiqueta">Pedido directo</p>
		<h1>Pide sin comisiones, a <span class="acento">precio de mostrador.</span></h1>
		<p class="suave lead">Arma tu pedido, lo enviamos por WhatsApp y te confirmamos el tiempo. Recoge en barra o recibe en tu oficina en Santa Cruz Atoyac.</p>

		{#if !data.productos}
			<p class="aviso" role="alert">No pudimos cargar el menú. Recarga la página o escríbenos por WhatsApp.</p>
		{:else}
			<form class="cols" onsubmit={enviar} novalidate>
				<div>
					{#each CATEGORIAS as c}
						{@const lista = disponibles.filter((p) => p.categoria === c)}
						{#if lista.length}
							<h2 class="etiqueta cat">{c}</h2>
							<ul class="lista">
								{#each lista as p}
									<li class="tarjeta fila">
										<div><strong>{p.nombre}</strong><span class="precio">{pesos(p.precio)}</span></div>
										<div class="cont" role="group" aria-label="Cantidad de {p.nombre}">
											<button type="button" aria-label="Quitar uno de {p.nombre}" disabled={!cantidades[p.id]} onclick={() => cambiar(p.id, -1)}><Icono nombre="menos" /></button>
											<output class="precio" aria-live="polite">{cantidades[p.id] ?? 0}</output>
											<button type="button" aria-label="Agregar uno de {p.nombre}" onclick={() => cambiar(p.id, 1)}><Icono nombre="mas" /></button>
										</div>
									</li>
								{/each}
							</ul>
						{/if}
					{/each}
				</div>

				<aside class="tarjeta resumen" aria-label="Tu pedido">
					<h2>Tu pedido</h2>
					{#if lineas.length}
						<ul class="res">{#each lineas as l}<li><span>{l.cantidad} x {l.nombre}</span><span class="precio">{pesos(l.cantidad * l.precio)}</span></li>{/each}</ul>
						<p class="total"><span>Total</span><span class="precio">{pesos(total)}</span></p>
					{:else}
						<p class="suave">Tu pedido está vacío. Elige algo rico.</p>
					{/if}

					<fieldset>
						<legend>¿Cómo lo recibes?</legend>
						<label><input type="radio" bind:group={d.modo} value="recoger" /> Recoger en barra</label>
						<label><input type="radio" bind:group={d.modo} value="domicilio" /> Entrega en Atoyac</label>
					</fieldset>
					<label class="campo">Tu nombre<input bind:value={d.nombre} autocomplete="name" required /></label>
					{#if d.modo === 'domicilio'}
						<label class="campo">Dirección de entrega<input bind:value={d.direccion} autocomplete="street-address" required /></label>
					{/if}
					<label class="campo">Notas (opcional)<textarea bind:value={d.nota} rows="2" placeholder="Sin cebolla, extra aguacate..."></textarea></label>

					{#if intento && falta}<p class="error" role="alert">{falta}</p>{/if}
					<button class="btn pago lg" type="submit"><Icono nombre="whatsapp" />Enviar por WhatsApp{cuantos ? ` · ${pesos(total)}` : ''}</button>
					<p class="suave nota">Los precios son de mostrador. Confirmamos tu pedido y el tiempo por WhatsApp.</p>
				</aside>
			</form>
		{/if}
	</div>
</section>

<style>
	.lead { font-size: var(--fs-18); max-width: 52ch; margin: var(--sp-4) 0 var(--sp-6); }
	.cols { display: grid; gap: var(--sp-6); grid-template-columns: 1.4fr 1fr; align-items: start; }
	.cat { margin: var(--sp-6) 0 var(--sp-3); }
	.cat:first-child { margin-top: 0; }
	.lista { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--sp-3); }
	.fila { display: flex; justify-content: space-between; align-items: center; gap: var(--sp-4); padding: var(--sp-3) var(--sp-4); }
	.fila > div:first-child { display: grid; }
	.cont { display: flex; align-items: center; gap: var(--sp-2); }
	.cont button { width: var(--toque); height: var(--toque); border-radius: 50%; border: 1.5px solid var(--c-linea-fuerte); background: var(--c-papel); color: var(--c-bosque); cursor: pointer; display: grid; place-items: center; }
	.cont button:disabled { opacity: .45; cursor: not-allowed; }
	.cont output { min-width: 24px; text-align: center; font-size: var(--fs-18); }
	.resumen { position: sticky; top: 80px; display: grid; gap: var(--sp-4); }
	.res { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--sp-2); }
	.res li, .total { display: flex; justify-content: space-between; gap: var(--sp-3); }
	.total { border-top: 1px solid var(--c-linea); padding-top: var(--sp-3); font-weight: 600; font-size: var(--fs-20); }
	fieldset { border: 0; padding: 0; margin: 0; display: grid; gap: var(--sp-2); }
	legend { font-weight: 600; margin-bottom: var(--sp-2); padding: 0; }
	fieldset label { display: flex; align-items: center; gap: var(--sp-2); min-height: var(--toque); }
	input[type='radio'] { width: 20px; height: 20px; accent-color: var(--c-hoja-fuerte); }
	.campo { display: grid; gap: var(--sp-1); font-weight: 600; font-size: var(--fs-14); }
	.campo input, .campo textarea { font: inherit; font-weight: 400; min-height: var(--toque); padding: 10px 14px; border: 1.5px solid var(--c-linea-fuerte); border-radius: var(--r-md); background: var(--c-papel); color: inherit; }
	.error, .aviso { color: var(--c-cancelado); font-weight: 600; }
	.aviso { margin-top: var(--sp-5); }
	.nota { font-size: var(--fs-14); }
	@media (max-width: 860px) { .cols { grid-template-columns: 1fr; } .resumen { position: static; } }
</style>
