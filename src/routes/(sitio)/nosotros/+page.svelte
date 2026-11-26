<script lang="ts">
	import Icono from '$lib/sitio/Icono.svelte';
	import Seo from '$lib/sitio/Seo.svelte';
	import { NEGOCIO } from '$lib/sitio/negocio';

	const cifras = [
		['14 hrs', 'de servicio continuo, de 7:00 a 21:00'],
		['0%', 'de comisión si pides en nuestro sitio'],
		['100%', 'insumos frescos, sin congelados'],
		['$0', 'de propina obligatoria']
	];
</script>

<Seo titulo="Nosotros" descripcion="Servimos alimentos recién preparados, con insumos frescos y a un precio justo, sin propina obligada, en Santa Cruz Atoyac." />

<section class="seccion">
	<div class="contenedor">
		<p class="etiqueta">Sobre Atoyac</p>
		<h1>Comida para tu <span class="acento">día a día.</span></h1>
		<p class="lead suave">Nacimos con una idea directa: servir alimentos recién preparados, con insumos limpios, porciones exactas y a un precio justo, sin obligar propina ni inflar costos de plataforma.</p>
	</div>
</section>

<section class="seccion oscuro">
	<div class="contenedor">
		<blockquote>“No somos comida rápida industrial. Exprimimos naranja fresca a las 6:40 de la mañana, recibimos pan artesanal del día, pesamos cada porción al gramo y colamos café cada dos horas.”</blockquote>
		<dl class="cifras">
			{#each cifras as [n, t]}<div><dt class="precio">{n}</dt><dd class="suave">{t}</dd></div>{/each}
		</dl>
	</div>
</section>

<section class="seccion">
	<div class="contenedor dos">
		<img class="local" src="/img/local-interior.jpg" alt="Interior del local" width="560" height="420" loading="lazy" />
		<div>
			<p class="etiqueta">Nuestra sucursal</p>
			<h2>23.7 m² pensados para la <span class="acento">frescura.</span></h2>
			<p class="suave">Un espacio compacto para comer en barra, pedir para llevar al momento o recoger lo que ordenaste desde la web o en el kiosco, sin hacer fila.</p>
			<ul class="datos">
				<li><Icono nombre="pin" /> {NEGOCIO.direccion}<br /><span class="suave">{NEGOCIO.zona}</span></li>
				<li><Icono nombre="reloj" /> {NEGOCIO.horario}</li>
				<li><Icono nombre="tienda" /> Barra, para llevar y recoger</li>
			</ul>
			<a class="btn sec" href={NEGOCIO.mapa} target="_blank" rel="noopener">Cómo llegar</a>
		</div>
	</div>
</section>

<section class="seccion arena">
	<div class="contenedor comunidad">
		<h2>Hecho para <span class="acento">vecinos</span> y oficinas de la zona.</h2>
		<p class="suave">En Santa Cruz Atoyac conviven oficinas, clínicas y familias que quieren desayunar o comer bien sin sobreprecios y sin perder 40 minutos. Queremos ser tu hábito: café en la mañana, algo sustancioso al mediodía y un antojo por la tarde.</p>
		<p><a class="btn lg" href="/menu">Ver el menú</a></p>
	</div>
</section>

<style>
	.lead { font-size: var(--fs-20); max-width: 44ch; margin-top: var(--sp-5); }
	blockquote { margin: 0; font-family: var(--f-acento); font-style: italic; font-size: clamp(var(--fs-24), 3.5vw, var(--fs-40)); line-height: 1.25; max-width: 28em; }
	.cifras { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: var(--sp-5); margin: var(--sp-7) 0 0; }
	.cifras dt { font-size: var(--fs-40); color: var(--c-maiz); }
	.cifras dd { margin: 0; }
	.dos { display: grid; gap: var(--sp-7); align-items: center; grid-template-columns: 1fr 1fr; }
	.local { width: 100%; height: auto; border-radius: var(--r-lg); aspect-ratio: 4/3; object-fit: cover; }
	.datos { list-style: none; padding: 0; margin: var(--sp-5) 0; display: grid; gap: var(--sp-3); }
	.datos :global(svg) { vertical-align: -4px; margin-right: var(--sp-1); color: var(--c-hoja); }
	.arena { background: var(--c-arena); }
	.comunidad { display: grid; gap: var(--sp-4); max-width: 720px; }
	@media (max-width: 800px) { .dos { grid-template-columns: 1fr; gap: var(--sp-6); } }
</style>
