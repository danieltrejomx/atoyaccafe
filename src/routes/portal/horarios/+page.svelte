<script lang="ts">
	import { onMount } from 'svelte';
	import { api, type HorarioCelda } from '$lib/api';

	const EMPLEADOS = ['', 'Claudia', 'Daniel'];
	const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
	const HORAS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
	const fmtHora = (h: number) => `${h.toString().padStart(2, '0')}:00`;

	let semana = $state(semanaISO(new Date()));
	let celdas = $state<HorarioCelda[]>([]);
	let error = $state('');
	let copiando = $state(false);

	function semanaISO(d: Date): string {
		const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
		tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
		const año = tmp.getUTCFullYear();
		const inicio = new Date(Date.UTC(año, 0, 1));
		const num = Math.ceil(((tmp.getTime() - inicio.getTime()) / 86400000 + 1) / 7);
		return `${año}-W${num.toString().padStart(2, '0')}`;
	}

	function semanaAnterior(s: string): string {
		const [año, num] = s.split('-W').map(Number);
		if (num <= 1) return `${año - 1}-W52`;
		return `${año}-W${(num - 1).toString().padStart(2, '0')}`;
	}

	function semanaSiguiente(s: string): string {
		const [año, num] = s.split('-W').map(Number);
		if (num >= 52) return `${año + 1}-W01`;
		return `${año}-W${(num + 1).toString().padStart(2, '0')}`;
	}

	function valor(dia: number, hora: number): string {
		return celdas.find(c => c.dia === dia && c.hora === hora)?.empleado ?? '';
	}

	async function cargar() {
		try { celdas = await api.horarios(semana); } catch (e) { error = (e as Error).message; }
	}

	async function cambiar(dia: number, hora: number, empleado: string) {
		// Actualizar localmente de inmediato
		const idx = celdas.findIndex(c => c.dia === dia && c.hora === hora);
		if (idx >= 0) {
			celdas[idx] = { ...celdas[idx], empleado };
		} else {
			celdas = [...celdas, { id: 0, semana, dia, hora, empleado, actualizadoEn: Date.now() }];
		}
		try {
			await api.guardarCelda({ semana, dia, hora, empleado });
		} catch (e) { error = (e as Error).message; }
	}

	async function copiarAnterior() {
		copiando = true;
		try {
			await api.copiarSemana(semanaAnterior(semana), semana);
			await cargar();
		} catch (e) { error = (e as Error).message; }
		copiando = false;
	}

	function horasEmpleado(nombre: string): number {
		return celdas.filter(c => c.empleado === nombre).length;
	}

	const totalCobertura = $derived(celdas.filter(c => c.empleado !== '').length);
	const totalSlots = $derived(DIAS.length * HORAS.length);

	$effect(() => { semana; cargar(); });
	onMount(cargar);
</script>

<div class="pagina">
	<div class="cabecera">
		<h1>Horario Semanal de Cafetería</h1>
		<p class="subtitulo">8:00 AM – 7:00 PM</p>
	</div>

	<div class="controles">
		<button class="btn sec chico" onclick={() => (semana = semanaAnterior(semana))}>← Anterior</button>
		<strong class="semana-label">{semana}</strong>
		<button class="btn sec chico" onclick={() => (semana = semanaSiguiente(semana))}>Siguiente →</button>
		<button class="btn chico" onclick={copiarAnterior} disabled={copiando}>
			{copiando ? 'Copiando...' : 'Copiar semana anterior'}
		</button>
	</div>

	{#if error}<p class="error">{error}</p>{/if}

	<!-- Resumen -->
	<div class="resumen">
		<div class="panel tarjeta">
			<p class="etiqueta">Horas Claudia</p>
			<p class="gran">{horasEmpleado('Claudia')} hrs</p>
		</div>
		<div class="panel tarjeta">
			<p class="etiqueta">Horas Daniel</p>
			<p class="gran">{horasEmpleado('Daniel')} hrs</p>
		</div>
		<div class="panel tarjeta">
			<p class="etiqueta">Cobertura Total</p>
			<p class="gran">{totalCobertura} hrs</p>
			<p class="pct">{totalSlots > 0 ? Math.round((totalCobertura / totalSlots) * 100) : 0}% cubierto</p>
		</div>
	</div>

	<!-- Parrilla -->
	<div class="panel tabla-wrap">
		<table>
			<thead>
				<tr>
					<th class="hora-col">Hora</th>
					{#each DIAS as d}<th>{d}</th>{/each}
				</tr>
			</thead>
			<tbody>
				{#each HORAS as h}
					<tr>
						<td class="hora-col">{fmtHora(h)} - {fmtHora(h + 1)}</td>
						{#each DIAS as _, di}
							{@const emp = valor(di, h)}
							<td class="celda" class:claudia={emp === 'Claudia'} class:daniel={emp === 'Daniel'} class:libre={emp === ''}>
								<select
									value={emp}
									onchange={(e) => cambiar(di, h, (e.target as HTMLSelectElement).value)}
								>
									<option value="">Libre</option>
									{#each EMPLEADOS.filter(e => e !== '') as e}
										<option value={e}>{e}</option>
									{/each}
								</select>
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr>
					<td class="hora-col"><strong>Total cubierto</strong></td>
					{#each DIAS as _, di}
						<td class="num"><strong>{celdas.filter(c => c.dia === di && c.empleado !== '').length} h</strong></td>
					{/each}
				</tr>
			</tfoot>
		</table>
	</div>

	<!-- Resumen visual -->
	<div class="panel">
		<h2>Horas Semanales</h2>
		<div class="barras">
			{#each ['Claudia', 'Daniel'] as nombre}
				{@const hrs = horasEmpleado(nombre)}
				<div class="barra-row">
					<span class="barra-nombre">{nombre}</span>
					<div class="barra-track">
						<div class="barra-fill {nombre.toLowerCase()}" style:width="{Math.min(hrs / 40 * 100, 100)}%"></div>
					</div>
					<span class="barra-num">{hrs} hrs</span>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.cabecera { text-align: center; }
	.subtitulo { margin: 0; color: var(--c-texto-suave); font-size: var(--fs-16); }
	.controles { display: flex; gap: var(--sp-3); align-items: center; justify-content: center; flex-wrap: wrap; }
	.semana-label { font: 700 var(--fs-20) var(--f-titulo); min-width: 100px; text-align: center; }

	.resumen { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--sp-4); }
	.tarjeta { text-align: center; }
	.gran { font: 700 var(--fs-40) var(--f-titulo); margin: var(--sp-2) 0 0; color: var(--c-bosque); }
	.pct { font-size: var(--fs-14); color: var(--c-texto-suave); margin: 0; }

	.tabla-wrap { overflow-x: auto; padding: var(--sp-3); }
	table { width: 100%; border-collapse: collapse; font-size: var(--fs-14); }
	th { background: var(--c-bosque); color: #fff; padding: var(--sp-2) var(--sp-2); text-align: center; font-weight: 600; }
	td { padding: 0; text-align: center; border: 1px solid var(--c-linea); }
	.hora-col { font-weight: 600; padding: var(--sp-1) var(--sp-2); white-space: nowrap; background: var(--c-arena); min-width: 110px; text-align: left; }
	tfoot td { background: var(--c-arena); padding: var(--sp-2); }

	.celda select {
		width: 100%;
		border: none;
		background: transparent;
		padding: 8px 4px;
		font: 600 var(--fs-14) var(--f-texto);
		text-align: center;
		cursor: pointer;
		appearance: none;
		-webkit-appearance: none;
	}
	.celda select:focus { outline: 2px solid var(--c-hoja-fuerte); outline-offset: -2px; }
	.celda.claudia { background: #d4a84720; }
	.celda.claudia select { color: #8A6A1F; }
	.celda.daniel { background: #2F5D4520; }
	.celda.daniel select { color: #2F5D45; }
	.celda.libre { background: var(--c-blanco); }
	.celda.libre select { color: var(--c-texto-suave); }

	h2 { margin-bottom: var(--sp-3); }
	.barras { display: grid; gap: var(--sp-3); }
	.barra-row { display: flex; align-items: center; gap: var(--sp-3); }
	.barra-nombre { width: 80px; font-weight: 600; font-size: var(--fs-14); }
	.barra-track { flex: 1; height: 28px; background: var(--c-arena); border-radius: var(--r-sm); overflow: hidden; }
	.barra-fill { height: 100%; border-radius: var(--r-sm); transition: width 0.3s ease; }
	.barra-fill.claudia { background: #d4a847; }
	.barra-fill.daniel { background: #2F5D45; }
	.barra-num { font: 700 var(--fs-16) var(--f-titulo); min-width: 60px; }

	@media (max-width: 700px) {
		.resumen { grid-template-columns: 1fr; }
		table { font-size: var(--fs-12); }
	}
</style>
