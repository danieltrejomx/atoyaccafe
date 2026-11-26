<script lang="ts">
	import { esBebida, type Producto } from '$lib/types';
	import Icono from './Icono.svelte';

	let { producto, onelegir }: { producto: Producto; onelegir: (p: Producto) => void } = $props();
	const bebida = $derived(esBebida(producto.categoria));
</script>

<button class="tarjeta" aria-disabled={!producto.disponible} onclick={() => producto.disponible && onelegir(producto)}>
	<span class="foto" class:agotado={!producto.disponible}>
		{#if producto.foto}
			<img src={producto.foto} alt="" />
		{:else}
			<Icono nombre={bebida ? 'taza' : 'cubiertos'} tam={48} />
		{/if}
	</span>
	{#if producto.nombre.startsWith('Combo')}<span class="sello">Promo</span>{/if}
	<span class="nombre">{producto.nombre}</span>
	<span class="desc">{producto.descripcion}</span>
	<span class="pie">
		<span class="precio">${producto.precio}</span>
		{#if producto.disponible}
			<span class="mas"><Icono nombre="mas" /></span>
		{:else}
			<span class="agot">Agotado por hoy</span>
		{/if}
	</span>
</button>

<style>
	.tarjeta {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--sp-2);
		padding: var(--sp-5) var(--sp-4) var(--sp-4);
		background: var(--c-blanco);
		border: 0;
		border-radius: var(--r-lg);
		box-shadow: var(--sh-1);
		color: var(--c-texto);
		text-align: center;
		cursor: pointer;
		transition: transform var(--dur-2) var(--ease-salida);
		touch-action: manipulation;
	}
	.tarjeta:active { transform: scale(0.98); }
	.tarjeta:active .foto { transform: rotate(4deg); }
	.tarjeta:focus-visible { outline: none; box-shadow: var(--foco); }
	.tarjeta[aria-disabled='true'] { cursor: default; }
	.foto {
		width: 160px;
		height: 160px;
		border-radius: 50%;
		background: var(--c-arena);
		color: var(--c-salvia);
		display: grid;
		place-items: center;
		overflow: hidden;
		box-shadow: var(--sh-2);
		transition: transform var(--dur-2) var(--ease-salida);
	}
	.foto img { width: 100%; height: 100%; object-fit: cover; }
	.foto.agotado { filter: grayscale(1); opacity: 0.6; }
	.sello {
		position: absolute;
		top: var(--sp-4);
		left: var(--sp-4);
		background: var(--c-maiz);
		color: var(--c-bosque);
		font: 600 var(--fs-14) var(--f-titulo);
		padding: 4px 12px;
		border-radius: var(--r-pill);
		transform: rotate(-6deg);
	}
	.nombre {
		font: 600 var(--fs-16) var(--f-titulo);
		text-transform: uppercase;
		letter-spacing: var(--ls-etiqueta);
	}
	.desc {
		font-size: var(--fs-14);
		color: var(--c-texto-suave);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		min-height: 2.6em;
	}
	.pie { display: flex; align-items: center; justify-content: space-between; width: 100%; margin-top: auto; }
	.precio { font: 600 var(--fs-24) var(--f-titulo); font-variant-numeric: tabular-nums; }
	.mas {
		width: var(--toque-kiosco);
		height: var(--toque-kiosco);
		border-radius: 50%;
		background: var(--c-hoja-fuerte);
		color: #fff;
		display: grid;
		place-items: center;
	}
	.agot {
		background: var(--c-entregado-bg);
		color: var(--c-entregado);
		font: 600 var(--fs-14) var(--f-titulo);
		padding: 6px 12px;
		border-radius: var(--r-pill);
	}
</style>
