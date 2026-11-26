<script lang="ts">
	import Icono from '$lib/sitio/Icono.svelte';
	import Seo from '$lib/sitio/Seo.svelte';
	import { NEGOCIO, enlaceWa } from '$lib/sitio/negocio';

	let restante = $state<number | null>(null); // null en el servidor: evita desajuste de hidratación
	$effect(() => {
		const meta = new Date(NEGOCIO.inauguracion).getTime();
		const tic = () => (restante = Math.max(0, meta - Date.now()));
		tic();
		const t = setInterval(tic, 1000);
		return () => clearInterval(t);
	});
	const partes = $derived.by(() => {
		const s = Math.floor((restante ?? 0) / 1000);
		return [['Días', Math.floor(s / 86400)], ['Horas', Math.floor(s / 3600) % 24], ['Min', Math.floor(s / 60) % 60], ['Seg', s % 60]] as const;
	});
	const wa = enlaceWa('Hola Atoyac, quiero reclamar mi café gratis de inauguración.');
</script>

<Seo titulo="Gran inauguración" descripcion="Te esperamos el sábado 5 de diciembre desde las 9:00. Pasa por tu café de cortesía a Av. Popocatépetl 289, Santa Cruz Atoyac." />

<section class="seccion oscuro">
	<div class="contenedor centro">
		<p class="etiqueta">Estás invitado</p>
		<h1>Gran <span class="acento">inauguración</span></h1>
		<p class="lead">Sábado 5 de diciembre, desde las 9:00</p>
		{#if restante !== null && restante > 0}
			<div class="cuenta" role="timer" aria-label="Tiempo para la inauguración">
				{#each partes as [t, n]}<div><span class="precio">{n}</span><small>{t}</small></div>{/each}
			</div>
		{/if}
	</div>
</section>

<section class="seccion">
	<div class="contenedor dos">
		<div class="tarjeta">
			<p class="etiqueta">Cortesía de bienvenida</p>
			<h2>Tu café es <span class="acento">gratis</span></h2>
			<p class="suave">Escríbenos por WhatsApp para registrar tu cortesía y reclámala cuando quieras.</p>
			<p><a class="btn pago lg" href={wa} target="_blank" rel="noopener"><Icono nombre="whatsapp" />Reclamar mi café</a></p>
		</div>
		<div class="tarjeta">
			<p class="etiqueta">Dónde y cuándo</p>
			<ul class="datos">
				<li><Icono nombre="pin" /> {NEGOCIO.direccion}<br /><span class="suave">{NEGOCIO.zona}</span></li>
				<li><Icono nombre="reloj" /> {NEGOCIO.horario}</li>
			</ul>
			<a class="btn sec" href={NEGOCIO.mapa} target="_blank" rel="noopener">Cómo llegar</a>
		</div>
	</div>
	<div class="contenedor centro cierre">
		<p class="suave">Aquí todas las personas son bienvenidas.</p>
		<a class="btn lg" href="/menu">Ver el menú</a>
	</div>
</section>

<style>
	.centro { text-align: center; display: grid; gap: var(--sp-4); justify-items: center; }
	.lead { font-size: var(--fs-24); font-family: var(--f-titulo); }
	.cuenta { display: flex; gap: var(--sp-4); margin-top: var(--sp-4); }
	.cuenta div { display: grid; min-width: 72px; padding: var(--sp-3); border: 1px solid rgba(247,243,236,.24); border-radius: var(--r-md); }
	.cuenta .precio { font-size: var(--fs-40); }
	.cuenta small { color: var(--c-menta-tv); text-transform: uppercase; letter-spacing: var(--ls-etiqueta); font-size: var(--fs-12); }
	.dos { display: grid; gap: var(--sp-5); grid-template-columns: 1fr 1fr; }
	.tarjeta { display: grid; gap: var(--sp-4); align-content: start; }
	.datos { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--sp-3); }
	.datos :global(svg) { vertical-align: -4px; margin-right: var(--sp-1); color: var(--c-hoja); }
	.cierre { margin-top: var(--sp-7); }
	@media (max-width: 760px) { .dos { grid-template-columns: 1fr; } .cuenta { gap: var(--sp-2); } .cuenta div { min-width: 64px; } }
</style>
