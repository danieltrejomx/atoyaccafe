<script lang="ts">
	import Seo from '$lib/sitio/Seo.svelte';
	import { pesos } from '$lib/sitio/negocio';

	let { data } = $props();
	const ancla = (c: string) => c.toLowerCase().replace(/\s+/g, '-');
</script>

<Seo titulo="Menú" descripcion="Amanecer, mediodía y tarde: sándwiches, baguettes, crepas, jugos, aguas frescas y café. Precios de mostrador, sin propina." />

<section class="seccion">
	<div class="contenedor">
		<p class="etiqueta">Menú</p>
		<h1>Lo que <span class="acento">preparamos</span> hoy</h1>

		{#if data.error}
			<p class="vacio">No pudimos cargar el menú. Recarga la página en un momento.</p>
		{:else if !data.grupos.length}
			<p class="vacio">Por ahora no hay nada aquí. Vuelve en un rato.</p>
		{:else}
			<nav class="riel" aria-label="Categorías">
				{#each data.grupos as g}<a href="#{ancla(g.categoria)}">{g.categoria}</a>{/each}
			</nav>
			{#each data.grupos as g}
				<section id={ancla(g.categoria)} aria-labelledby="t-{ancla(g.categoria)}">
					<h2 id="t-{ancla(g.categoria)}" class="etiqueta cat">{g.categoria}</h2>
					<ul class="rejilla">
						{#each g.productos as p}
							<li class="tarjeta plato" class:agotado={!p.disponible}>
								{#if p.foto}<img class="foto" src={p.foto} alt="" width="120" height="120" loading="lazy" />{:else}<span class="foto" aria-hidden="true"></span>{/if}
								<div>
									<h3>{p.nombre}</h3>
									{#if p.descripcion}<p class="suave desc">{p.descripcion}</p>{/if}
									<p><span class="precio">{pesos(p.precio)}</span>{#if !p.disponible} <span class="ago">Agotado por hoy</span>{/if}</p>
								</div>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
			<div class="cta"><a class="btn lg" href="/delivery">Pedir a domicilio</a></div>
		{/if}
	</div>
</section>

<style>
	h1 { margin-bottom: var(--sp-5); }
	.vacio { margin-top: var(--sp-6); font-size: var(--fs-18); }
	.riel { display: flex; gap: var(--sp-2); overflow-x: auto; padding-block: var(--sp-2) var(--sp-4); position: sticky; top: 64px; background: var(--c-papel); z-index: 1; scrollbar-width: thin; }
	.riel a { flex: none; display: inline-flex; align-items: center; min-height: var(--toque); padding: 0 18px; border-radius: var(--r-pill); border: 1.5px solid var(--c-linea-fuerte); text-decoration: none; font-weight: 600; }
	.riel a:hover { background: var(--c-salvia-claro); }
	section[id] { scroll-margin-top: 140px; }
	.cat { margin: var(--sp-7) 0 var(--sp-4); font-size: var(--fs-18); }
	.rejilla { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--sp-4); grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); }
	.plato { display: flex; gap: var(--sp-4); align-items: center; padding: var(--sp-4); }
	.plato .foto { width: 96px; flex: none; }
	.agotado .foto { opacity: .45; filter: grayscale(1); }
	h3 { margin-bottom: var(--sp-1); }
	.desc { font-size: var(--fs-14); display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: var(--sp-1); }
	.precio { font-size: var(--fs-20); }
	.ago { color: var(--c-cancelado); font-weight: 600; font-size: var(--fs-14); margin-left: var(--sp-2); }
	.cta { margin-top: var(--sp-7); text-align: center; }
</style>
