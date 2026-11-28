<script lang="ts">
	import { onMount } from 'svelte';
	import CapturaManual from '$lib/portal/CapturaManual.svelte';
	import Icono from '$lib/portal/Icono.svelte';

	import TarjetaPedido from '$lib/portal/TarjetaPedido.svelte';
	import { ETIQUETA_CANAL, NOMBRE_CANAL, TABS } from '$lib/portal/acceso';
	import { pedidosVivos } from '$lib/portal/pedidos.svelte';
	import type { Canal } from '$lib/types';

	let { data } = $props();
	let tab = $state<Canal | 'todos'>('todos');
	let canalCaptura = $state<Canal>('interno');
	const canalActivo = $derived(tab === 'todos' ? canalCaptura : tab);
	let sonido = $state(false);
	let destello = $state<Canal | null>(null);
	let capturando = $state(false);
	let verCerrados = $state(false);
	let ctx: AudioContext | undefined;
	const puedeCobrar = $derived(data.usuario?.rol !== 'cocina');

	const pv = pedidosVivos((p) => {
		destello = p.canal;
		setTimeout(() => (destello = null), 3000);
		if (sonido) {
			pitar();
			const productos = p.items.map(i => `${i.cantidad} ${i.nombre}`).join(', ');
			anunciar(`Nuevo pedido, turno ${p.turno}. ${productos}`);
		}
	});
	onMount(() => {
		cargarVoces();
		return pv.iniciar();
	});

	function pitar() {
		if (!ctx) return;
		[880, 1175].forEach((f, i) => {
			const o = ctx!.createOscillator();
			const g = ctx!.createGain();
			o.frequency.value = f;
			o.connect(g).connect(ctx!.destination);
			const t = ctx!.currentTime + i * 0.2;
			g.gain.setValueAtTime(0.25, t);
			g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
			o.start(t);
			o.stop(t + 0.4);
		});
	}
	let voces: SpeechSynthesisVoice[] = [];
	function cargarVoces() {
		if (typeof speechSynthesis === 'undefined') return;
		voces = speechSynthesis.getVoices();
		if (!voces.length) speechSynthesis.addEventListener('voiceschanged', () => (voces = speechSynthesis.getVoices()), { once: true });
	}

	function anunciar(texto: string) {
		if (typeof speechSynthesis === 'undefined') return;
		speechSynthesis.cancel();
		const u = new SpeechSynthesisUtterance(texto);
		u.lang = 'es-MX';
		u.rate = 0.9;
		u.volume = 1;
		const voz = voces.find((v) => v.lang.replace('_', '-') === 'es-MX') ?? voces.find((v) => v.lang.startsWith('es'));
		if (voz) u.voice = voz;
		speechSynthesis.speak(u);
	}
	function alternarSonido() {
		sonido = !sonido;
		if (sonido) {
			ctx ??= new AudioContext();
			void ctx.resume();
			cargarVoces();
			pitar();
			setTimeout(() => anunciar('Sonido activado'), 500);
		}
	}

	const abierto = (e: string) => e !== 'entregado' && e !== 'cancelado';
	const activos = (c: Canal) => pv.lista.filter((p) => p.canal === c && abierto(p.estado)).length;
	const visibles = $derived(
		pv.lista
			.filter((p) => (tab === 'todos' || p.canal === tab) && (verCerrados || abierto(p.estado)))
			.sort((a, b) => a.creadoEn - b.creadoEn)
	);
	const hayNuevos = (c: Canal) => pv.lista.some((p) => p.canal === c && p.estado === 'nuevo');
	const COLUMNAS = [['nuevo', 'Nuevos'], ['preparando', 'Preparando'], ['listo', 'Listos']] as const;
	const cerrados = $derived(visibles.filter((p) => !abierto(p.estado)));
</script>

<div class="monitor" class:flash={destello}>
	<section class="pedidos">
		<div class="barra">
			<div class="tabs" role="tablist" aria-label="Canales">
				<button role="tab" class="tab" class:parpadea={!!destello} aria-selected={tab === 'todos'} style="--canal: var(--c-bosque)" onclick={() => (tab = 'todos')}>
					<i></i>TODOS <span class="cuenta" class:nuevos={TABS.some(hayNuevos)}>{TABS.reduce((n, c) => n + activos(c), 0)}</span>
				</button>
				{#each TABS as c}
					<button role="tab" class="tab" class:parpadea={destello === c} aria-selected={tab === c} style="--canal: var(--c-canal-{c})" onclick={() => (tab = c)}>
						<i></i>{ETIQUETA_CANAL[c]} <span class="cuenta" class:nuevos={hayNuevos(c)}>{activos(c)}</span>
					</button>
				{/each}
			</div>
			<label class="fila ver"><input type="checkbox" bind:checked={verCerrados} /> Ver cerrados</label>
			<button class="btn quieto" onclick={alternarSonido} aria-pressed={sonido}>
				<Icono nombre={sonido ? 'volumen' : 'silencio'} /> {sonido ? 'Sonido activo' : 'Activar sonido'}
			</button>
			<button class="btn sec" onclick={() => (capturando = true)}><Icono nombre="plus" /> Capturar pedido</button>
		</div>

		{#if !pv.conectado}<p class="reconecta" role="status">Reconectando…</p>{/if}
		{#if pv.error}<p class="error" role="alert">{pv.error}</p>{/if}

		<div class="columnas">
			{#each COLUMNAS as [estado, titulo]}
				{@const grupo = visibles.filter((p) => p.estado === estado)}
				<div class="col">
					<h2 class="etiqueta">{titulo} ({grupo.length})</h2>
					{#each grupo as p (p.id)}
						<TarjetaPedido pedido={p} ahora={pv.ahora} {puedeCobrar} accion={pv.accion} />
					{:else}
						<p class="vacio">{estado === 'nuevo' ? `Sin pedidos${tab === 'todos' ? '' : ` de ${NOMBRE_CANAL[tab]}`} por ahora.` : 'Nada aquí.'}</p>
					{/each}
				</div>
			{/each}
		</div>
		{#if verCerrados}
			<h2 class="etiqueta">Cerrados hoy ({cerrados.length})</h2>
			<div class="rejilla">
				{#each cerrados as p (p.id)}
					<TarjetaPedido pedido={p} ahora={pv.ahora} {puedeCobrar} accion={pv.accion} />
				{:else}
					<p class="vacio">Ningún pedido cerrado{tab === 'todos' ? '' : ` de ${NOMBRE_CANAL[tab]}`}.</p>
				{/each}
			</div>
		{/if}
	</section>

</div>

{#if capturando}
	<div class="modal-fondo" role="presentation" onclick={(e) => e.target === e.currentTarget && (capturando = false)}>
		<div class="modal" role="dialog" aria-modal="true" aria-label="Capturar pedido">
			<div class="fila" style="justify-content: space-between">
				{#if tab === 'todos'}
					<label class="fila"><h2>Capturar pedido de</h2>
						<select bind:value={canalCaptura}>{#each TABS as c}<option value={c}>{NOMBRE_CANAL[c]}</option>{/each}</select>
					</label>
				{:else}
					<h2>Capturar pedido de {NOMBRE_CANAL[tab]}</h2>
				{/if}
				<button class="btn quieto chico" onclick={() => (capturando = false)} aria-label="Cerrar"><Icono nombre="x" /></button>
			</div>
			{#key canalActivo}<CapturaManual canal={canalActivo} onCreado={() => ((capturando = false), pv.recargar())} />{/key}
		</div>
	</div>
{/if}

<style>
	.monitor { display: grid; grid-template-columns: 1fr; height: calc(100dvh - 52px); transition: box-shadow var(--dur-2); }
	.monitor.flash { box-shadow: inset 0 0 0 6px var(--c-maiz); }
	.pedidos { padding: 0 var(--sp-5) var(--sp-5); overflow-y: auto; display: grid; gap: var(--sp-4); align-content: start; }
	.barra { display: flex; gap: var(--sp-3); align-items: center; justify-content: flex-end; flex-wrap: wrap; padding-bottom: var(--sp-3); position: sticky; top: 0; background: var(--c-papel); z-index: 1; }
	.tabs { display: flex; flex: 1 1 100%; overflow-x: auto; border-bottom: 1px solid var(--c-linea); }
	.tab { font: 600 var(--fs-18) var(--f-titulo); letter-spacing: var(--ls-etiqueta); height: 64px; padding: 0 var(--sp-4); flex: none; border: 0; border-bottom: 4px solid transparent; background: none; color: var(--c-hoja); cursor: pointer; display: inline-flex; gap: var(--sp-2); align-items: center; }
	.tab i { width: 10px; height: 10px; border-radius: 50%; background: var(--canal); }
	.tab[aria-selected='true'] { color: var(--c-bosque); border-bottom-color: var(--canal); }
	.cuenta { background: var(--c-salvia-claro); color: var(--c-bosque); border-radius: var(--r-pill); min-width: 28px; padding: 0 var(--sp-2); text-align: center; font-size: var(--fs-14); letter-spacing: 0; line-height: 24px; font-variant-numeric: tabular-nums; }
	.cuenta.nuevos { background: var(--c-barro); color: #fff; }
	.parpadea { animation: pulso .6s 5 alternate; }
	@keyframes pulso { to { background: var(--c-maiz-claro); } }
	.ver { font-size: var(--fs-14); min-height: var(--toque); }
	.ver input { min-height: 0; width: 18px; height: 18px; accent-color: var(--c-hoja-fuerte); }
	.columnas { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--sp-4); align-items: start; }
	.col { display: grid; gap: var(--sp-3); align-content: start; }
	.rejilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--sp-4); align-items: start; }
	.reconecta { margin: 0; justify-self: start; background: var(--c-maiz-claro); color: var(--c-preparando); padding: var(--sp-1) var(--sp-3); border-radius: var(--r-pill); font-size: var(--fs-14); font-weight: 600; }
	@media (max-width: 1100px) {
		.columnas { grid-template-columns: 1fr; }
	}
	@media (prefers-reduced-motion: reduce) { .parpadea { animation: none; background: var(--c-maiz-claro); } }
</style>
