<script lang="ts">
	import Icono from './Icono.svelte';
	import { NEGOCIO, enlaceWa } from './negocio';
</script>

<footer class="oscuro">
	<div class="contenedor rejilla">
		<div>
			<p class="marca">Atoyac</p>
			<p class="suave">Comida fresca para tu día a día.</p>
		</div>
		<address>
			<p><Icono nombre="pin" /> <a href={NEGOCIO.mapa} target="_blank" rel="noopener">{NEGOCIO.direccion}</a></p>
			<p><Icono nombre="reloj" /> {NEGOCIO.horario}</p>
			<p><Icono nombre="whatsapp" /> <a href={enlaceWa('Hola, me gustaría hacer un pedido o conocer más información.')} target="_blank" rel="noopener">WhatsApp {NEGOCIO.telefono}</a></p>
		</address>
		<nav aria-label="Pie">
			<a href="/menu">Menú</a><a href="/nosotros">Nosotros</a><a href="/delivery">Pedir a domicilio</a><a href="/inauguracion">Inauguración</a>
		</nav>
	</div>
	<p class="contenedor legal suave">© 2026 Atoyac Café · Santa Cruz Atoyac, Ciudad de México</p>
</footer>

<style>
	footer { padding-block: var(--sp-7) var(--sp-5); }
	.rejilla { display: grid; gap: var(--sp-6); grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
	.marca { font-family: var(--f-titulo); font-weight: 700; font-size: var(--fs-24); letter-spacing: .08em; text-transform: uppercase; }
	address { font-style: normal; display: grid; gap: var(--sp-2); }
	address :global(svg) { vertical-align: -4px; margin-right: var(--sp-1); color: var(--c-menta-tv); }
	nav { display: grid; gap: var(--sp-2); align-content: start; }
	a { text-decoration: none; }
	a:hover { text-decoration: underline; }
	.legal { margin-top: var(--sp-6); padding-top: var(--sp-4); border-top: 1px solid rgba(247,243,236,.16); font-size: var(--fs-14); }
</style>
