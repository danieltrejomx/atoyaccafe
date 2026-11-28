<script lang="ts">
	import { onMount } from 'svelte';
	import { api, type CajaMov } from '$lib/api';
	import Icono from '$lib/portal/Icono.svelte';
	import { pesos } from '$lib/portal/acceso';

	let movimientos = $state<CajaMov[]>([]);
	let error = $state('');
	let tipo = $state<string>('fondo_inicial');
	let monto = $state('');
	let concepto = $state('');
	let enviando = $state(false);

	const TIPOS: { id: string; nombre: string; signo: '+' | '-' }[] = [
		{ id: 'fondo_inicial', nombre: 'Fondo inicial', signo: '+' },
		{ id: 'venta_efectivo', nombre: 'Venta efectivo', signo: '+' },
		{ id: 'retiro', nombre: 'Retiro', signo: '-' },
		{ id: 'gasto', nombre: 'Gasto', signo: '-' },
		{ id: 'ajuste', nombre: 'Ajuste', signo: '+' }
	];

	const esEntrada = (t: string) => t === 'fondo_inicial' || t === 'venta_efectivo' || t === 'ajuste';
	const saldo = $derived(movimientos.reduce((acc, m) => acc + (esEntrada(m.tipo) ? m.monto : -m.monto), 0));
	const entradas = $derived(movimientos.filter(m => esEntrada(m.tipo)).reduce((a, m) => a + m.monto, 0));
	const salidas = $derived(movimientos.filter(m => !esEntrada(m.tipo)).reduce((a, m) => a + m.monto, 0));

	async function cargar() {
		try { movimientos = await api.movimientosCaja(); } catch (e) { error = (e as Error).message; }
	}

	async function registrar() {
		const val = parseInt(monto);
		if (!val || val <= 0) { error = 'Ingresa un monto válido'; return; }
		enviando = true;
		error = '';
		try {
			await api.crearMovCaja({ tipo, monto: val, concepto: concepto.trim() || undefined });
			monto = '';
			concepto = '';
			await cargar();
		} catch (e) { error = (e as Error).message; }
		enviando = false;
	}

	function hora(ts: number) {
		return new Date(ts).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' });
	}

	const nombreTipo = (t: string) => TIPOS.find(x => x.id === t)?.nombre ?? t;

	onMount(cargar);
</script>

<div class="pagina">
	<h1>Caja del día</h1>

	<div class="resumen">
		<div class="panel tarjeta entrada">
			<p class="etiqueta">Entradas</p>
			<p class="gran verde">+{pesos(entradas)}</p>
		</div>
		<div class="panel tarjeta salida">
			<p class="etiqueta">Salidas</p>
			<p class="gran rojo">-{pesos(salidas)}</p>
		</div>
		<div class="panel tarjeta saldo">
			<p class="etiqueta">Saldo en caja</p>
			<p class="gran">{pesos(saldo)}</p>
		</div>
	</div>

	<div class="panel">
		<h2>Registrar movimiento</h2>
		<div class="form-mov">
			<select bind:value={tipo}>
				{#each TIPOS as t}<option value={t.id}>{t.signo} {t.nombre}</option>{/each}
			</select>
			<input type="number" bind:value={monto} placeholder="Monto $" min="1" />
			<input type="text" bind:value={concepto} placeholder="Concepto (opcional)" maxlength="200" />
			<button class="btn" disabled={enviando} onclick={registrar}>Registrar</button>
		</div>
		{#if error}<p class="error">{error}</p>{/if}
	</div>

	<div class="panel">
		<h2>Movimientos de hoy</h2>
		{#if movimientos.length === 0}
			<p class="vacio">Sin movimientos todavía.</p>
		{:else}
			<table>
				<thead><tr><th>Hora</th><th>Tipo</th><th>Concepto</th><th class="num">Monto</th></tr></thead>
				<tbody>
					{#each movimientos as m (m.id)}
						<tr>
							<td>{hora(m.creadoEn)}</td>
							<td><span class="chip-tipo" class:entrada={esEntrada(m.tipo)} class:salida={!esEntrada(m.tipo)}>{nombreTipo(m.tipo)}</span></td>
							<td>{m.concepto || '—'}</td>
							<td class="num" class:verde={esEntrada(m.tipo)} class:rojo={!esEntrada(m.tipo)}>
								{esEntrada(m.tipo) ? '+' : '-'}{pesos(m.monto)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>

<style>
	.resumen { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--sp-4); }
	.tarjeta { text-align: center; }
	.gran { font: 700 var(--fs-40) var(--f-titulo); margin: var(--sp-2) 0 0; }
	.verde { color: var(--c-listo); }
	.rojo { color: var(--c-cancelado); }
	.form-mov { display: flex; gap: var(--sp-3); flex-wrap: wrap; align-items: center; margin-top: var(--sp-3); }
	.form-mov select, .form-mov input { flex: 1; min-width: 140px; }
	.form-mov .btn { flex: none; }
	h2 { margin-bottom: var(--sp-2); }
	.chip-tipo { display: inline-block; padding: 2px 10px; border-radius: var(--r-pill); font-size: var(--fs-12); font-weight: 600; }
	.chip-tipo.entrada { background: var(--c-listo-bg); color: var(--c-listo); }
	.chip-tipo.salida { background: var(--c-cancelado-bg); color: var(--c-cancelado); }
	@media (max-width: 700px) { .resumen { grid-template-columns: 1fr; } }
</style>
