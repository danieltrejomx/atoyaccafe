<script lang="ts">
	import Icono from '$lib/sitio/Icono.svelte';
	import Seo from '$lib/sitio/Seo.svelte';
	import { NEGOCIO, pesos } from '$lib/sitio/negocio';

	let { data } = $props();
</script>

<Seo titulo="Atoyac Café" descripcion="Comida fresca para tu día a día en Santa Cruz Atoyac, CDMX. Sándwiches, baguettes, crepas, jugos y café. Sin propina, para comer aquí o llevar." />

<section class="hero seccion">
	<div class="contenedor dos">
		<div>
			<p class="etiqueta">Santa Cruz Atoyac, CDMX</p>
			<h1>Comida fresca para tu <span class="acento">día a día.</span></h1>
			<p class="suave lead">Lo que quieres comer, rápido y sin propina. Siéntate, pide para llevar o recoge sin hacer fila.</p>
			<div class="acciones">
				<a class="btn lg" href="/menu">Ver el menú</a>
				<a class="btn lg sec" href="/delivery"><Icono nombre="moto" />Pedir a domicilio</a>
				<a class="btn lg sec" href={NEGOCIO.mapa} target="_blank" rel="noopener"><Icono nombre="pin" />Cómo llegar</a>
			</div>
		</div>
		<img class="foto grande" src="/img/dishes/sandwiches.jpg" alt="Sándwich recién preparado" width="520" height="520" fetchpriority="high" />
	</div>
</section>

{#if data.destacados.length}
	<section class="seccion arena">
		<div class="contenedor">
			<p class="etiqueta">De la barra</p>
			<h2>Lo que más se antoja</h2>
			<ul class="destacados">
				{#each data.destacados as p}
					<li>
						<a class="tarjeta plato" href="/menu#{p.categoria.toLowerCase().replace(/\s+/g, '-')}">
							<img class="foto" src={p.foto} alt="" width="140" height="140" loading="lazy" />
							<span class="etiqueta">{p.categoria}</span>
							<strong>{p.nombre}</strong>
							<span class="precio">{pesos(p.precio)}</span>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</section>
{/if}

<section class="seccion oscuro">
	<div class="contenedor dos">
		<img class="local" src="/img/local-interior.jpg" alt="Interior del local de Atoyac Café" width="560" height="420" loading="lazy" />
		<div>
			<p class="etiqueta">Nuestra sucursal</p>
			<h2>Pequeña, <span class="acento">rápida</span> y fresca.</h2>
			<p class="suave">En la barra pides para llevar. En el kiosco ordenas a tu gusto sin hacer fila. Y si pides desde la web, tu pedido te espera.</p>
			<ul class="datos">
				<li><Icono nombre="pin" /> {NEGOCIO.direccion}</li>
				<li><Icono nombre="reloj" /> {NEGOCIO.horario}</li>
			</ul>
			<a class="btn lg" href="/nosotros">Conócenos</a>
		</div>
	</div>
</section>

<style>
	.dos { display: grid; gap: var(--sp-7); align-items: center; grid-template-columns: 1.1fr .9fr; }
	.lead { font-size: var(--fs-20); margin-block: var(--sp-5); max-width: 34ch; }
	.acciones { display: flex; flex-wrap: wrap; gap: var(--sp-3); }
	.grande { width: 100%; max-width: 520px; justify-self: center; }
	.arena { background: var(--c-arena); }
	.destacados { list-style: none; padding: 0; margin: var(--sp-6) 0 0; display: grid; gap: var(--sp-5); grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
	.plato { display: grid; gap: var(--sp-2); justify-items: center; text-align: center; text-decoration: none; height: 100%; transition: transform var(--dur-2) var(--ease-salida); }
	.plato .foto { width: 140px; transition: transform var(--dur-2) var(--ease-salida); }
	.plato:active { transform: scale(.98); }
	.plato:active .foto { transform: rotate(4deg); }
	.local { width: 100%; height: auto; border-radius: var(--r-lg); aspect-ratio: 4/3; object-fit: cover; }
	.datos { list-style: none; padding: 0; margin: var(--sp-5) 0; display: grid; gap: var(--sp-2); }
	.datos :global(svg) { vertical-align: -4px; margin-right: var(--sp-1); color: var(--c-menta-tv); }
	h2 { margin-bottom: var(--sp-3); }
	@media (max-width: 800px) { .dos { grid-template-columns: 1fr; gap: var(--sp-6); } .grande { max-width: 300px; } }
</style>
