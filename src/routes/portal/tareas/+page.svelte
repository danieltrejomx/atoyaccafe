<script lang="ts">
	import { onMount } from 'svelte';
	import { api, type ChecklistItem } from '$lib/api';

	interface Tarea {
		id: string;
		nombre: string;
		rondas: number;
		requiereFoto?: boolean;
		esCompras?: boolean;
	}

	const TAREAS_1VEZ: Tarea[] = [
		{ id: 'lavado_bano', nombre: 'Lavado de baño', rondas: 1 },
		{ id: 'lavado_azotehuela', nombre: 'Lavado de azotehuela', rondas: 1 },
		{ id: 'barrida_calle', nombre: 'Barrida de calle', rondas: 1 },
		{ id: 'trapeado_mesas', nombre: 'Barrido y trapeado área de mesas', rondas: 1 },
		{ id: 'salsa_chilaquiles', nombre: 'Salsa verde de chilaquiles hecha y refrigerada', rondas: 1, requiereFoto: true },
		{ id: 'salsa_roja', nombre: 'Salsa roja lista', rondas: 1, requiereFoto: true },
		{ id: 'lista_compras', nombre: 'Lista de compras del día', rondas: 1, esCompras: true }
	];

	const TAREAS_3VECES: Tarea[] = [
		{ id: 'revision_bano', nombre: 'Revisión baño (papel, limpieza, ordenado)', rondas: 3 },
		{ id: 'revision_fachada', nombre: 'Revisión fachada exterior', rondas: 3 },
		{ id: 'revision_mesas', nombre: 'Revisión mesas interior', rondas: 3 },
		{ id: 'revision_cocina', nombre: 'Revisión cocina recogida', rondas: 3 },
		{ id: 'revision_salsas', nombre: 'Revisión salsas llenas (roja, verde)', rondas: 3 },
		{ id: 'revision_aderezos', nombre: 'Revisión aderezos (ranch, mil islas)', rondas: 3 },
		{ id: 'revision_aguas', nombre: 'Revisión aguas de sabor (jamaica, horchata)', rondas: 3 }
	];

	let items = $state<ChecklistItem[]>([]);
	let error = $state('');
	let cargando = $state(true);
	let enviando = $state<string | null>(null);

	// Compras inputs
	let comprasNormal = $state('');
	let comprasUrgente = $state('');

	function completado(tareaId: string, ronda: number): ChecklistItem | undefined {
		return items.find((i) => i.tarea === tareaId && i.ronda === ronda);
	}

	function hora(ts: number) {
		return new Date(ts).toLocaleTimeString('es-MX', {
			hour: '2-digit',
			minute: '2-digit',
			timeZone: 'America/Mexico_City'
		});
	}

	async function cargar() {
		try {
			items = await api.checklist();
		} catch (e) {
			error = (e as Error).message;
		}
		cargando = false;
	}

	async function marcar(tareaId: string, ronda: number, foto?: File, nota?: string) {
		const key = `${tareaId}_${ronda}`;
		if (enviando) return;
		enviando = key;
		error = '';
		try {
			await api.completarTarea(tareaId, ronda, foto, nota);
			await cargar();
		} catch (e) {
			error = (e as Error).message;
		}
		enviando = null;
	}

	function marcarConFoto(tareaId: string, ronda: number) {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/*';
		input.setAttribute('capture', 'environment');
		input.onchange = () => {
			const archivo = input.files?.[0];
			if (archivo) marcar(tareaId, ronda, archivo);
		};
		input.click();
	}

	function marcarCompras() {
		const partes: string[] = [];
		if (comprasNormal.trim()) partes.push(`Normal: ${comprasNormal.trim()}`);
		if (comprasUrgente.trim()) partes.push(`Urgente: ${comprasUrgente.trim()}`);
		if (partes.length === 0) {
			error = 'Escribe al menos un artículo en la lista de compras';
			return;
		}
		marcar('lista_compras', 1, undefined, partes.join(' | '));
	}

	function subirFotoTarea(tareaId: string, ronda: number, e: Event) {
		const input = e.target as HTMLInputElement;
		const archivo = input.files?.[0];
		if (!archivo) return;
		marcar(tareaId, ronda, archivo);
		input.value = '';
	}

	onMount(cargar);
</script>

<svelte:head><title>Tareas | Atoyac Café</title></svelte:head>

<div class="pagina">
	<h1>Tareas del día</h1>
	{#if error}<p class="error">{error}</p>{/if}

	{#if cargando}
		<p>Cargando...</p>
	{:else}
		<!-- TAREAS 1 VEZ AL DÍA -->
		<div class="panel">
			<h2>Tareas 1 vez al día</h2>
			<ul class="lista-tareas">
				{#each TAREAS_1VEZ as t (t.id)}
					{@const hecho = completado(t.id, 1)}
					<li class="tarea-item" class:hecho>
						<div class="tarea-info">
							{#if hecho}
								<span class="check">&#10003;</span>
							{/if}
							<span class="tarea-nombre" class:tachado={!!hecho}>{t.nombre}</span>
						</div>

						{#if hecho}
							<div class="tarea-meta">
								<small class="hora-done">{hora(hecho.completadoEn)}</small>
								{#if hecho.foto}
									<a href="/api/avisos/fotos/{hecho.foto}" target="_blank" class="foto-link">Ver foto</a>
								{/if}
								{#if hecho.nota}
									<small class="nota-text">{hecho.nota}</small>
								{/if}
							</div>
						{:else if t.esCompras}
							<div class="compras-form">
								<div class="compras-row">
									<label>
										<span class="etiqueta">Normal</span>
										<input type="text" bind:value={comprasNormal} placeholder="Ej: Tomates, Cebolla..." />
									</label>
									<label>
										<span class="etiqueta">Urgente</span>
										<input type="text" bind:value={comprasUrgente} placeholder="Ej: Aguacate..." />
									</label>
								</div>
								<button
									class="btn chico"
									disabled={enviando === `${t.id}_1`}
									onclick={marcarCompras}
								>
									Guardar lista
								</button>
							</div>
						{:else}
							<div class="tarea-acciones">
								{#if t.requiereFoto}
									<button
										class="btn chico"
										disabled={enviando === `${t.id}_1`}
										onclick={() => marcarConFoto(t.id, 1)}
									>
										&#128247; Completar con foto
									</button>
								{:else}
									<button
										class="btn chico"
										disabled={enviando === `${t.id}_1`}
										onclick={() => marcar(t.id, 1)}
									>
										Completar
									</button>
								{/if}
								<label class="btn chico sec foto-btn">
									&#128247;
									<input
										type="file"
										accept="image/*"
										capture="environment"
										onchange={(e) => subirFotoTarea(t.id, 1, e)}
										hidden
									/>
								</label>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		</div>

		<!-- REVISIONES 3 VECES AL DÍA -->
		<div class="panel">
			<h2>Revisiones 3 veces al día</h2>
			<ul class="lista-tareas">
				{#each TAREAS_3VECES as t (t.id)}
					<li class="tarea-item tarea-3x">
						<div class="tarea-info">
							<span class="tarea-nombre">{t.nombre}</span>
						</div>
						<div class="rondas">
							{#each [1, 2, 3] as r (r)}
								{@const hecho = completado(t.id, r)}
								{#if hecho}
									<div class="ronda-done">
										<span class="ronda-circulo done">&#10003;</span>
										<small>R{r} - {hora(hecho.completadoEn)}</small>
										{#if hecho.foto}
											<a href="/api/avisos/fotos/{hecho.foto}" target="_blank" class="foto-link-sm">foto</a>
										{/if}
									</div>
								{:else}
									<div class="ronda-pendiente">
										<button
											class="ronda-circulo pendiente"
											disabled={enviando === `${t.id}_${r}`}
											onclick={() => marcar(t.id, r)}
										>
											{r}
										</button>
										<label class="foto-mini-btn">
											&#128247;
											<input
												type="file"
												accept="image/*"
												capture="environment"
												onchange={(e) => subirFotoTarea(t.id, r, e)}
												hidden
											/>
										</label>
									</div>
								{/if}
							{/each}
						</div>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	h2 {
		margin-bottom: var(--sp-3);
	}
	.lista-tareas {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--sp-3);
	}
	.tarea-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-3);
		padding: var(--sp-3);
		border-radius: var(--r-md);
		background: var(--c-arena);
		flex-wrap: wrap;
	}
	.tarea-item.hecho {
		background: var(--c-listo-bg, #e8f5e9);
	}
	.tarea-info {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		flex: 1;
		min-width: 200px;
	}
	.check {
		color: var(--c-listo, #2e7d32);
		font-size: var(--fs-20, 20px);
		font-weight: 700;
	}
	.tarea-nombre {
		font-weight: 600;
		font-size: var(--fs-16);
	}
	.tachado {
		text-decoration: line-through;
		color: var(--c-texto-suave);
	}
	.tarea-meta {
		display: flex;
		align-items: center;
		gap: var(--sp-3);
		flex-wrap: wrap;
	}
	.hora-done {
		color: var(--c-listo, #2e7d32);
		font-weight: 600;
		font-size: var(--fs-14);
	}
	.nota-text {
		color: var(--c-texto-suave);
		font-size: var(--fs-14);
		max-width: 300px;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.foto-link,
	.foto-link-sm {
		color: var(--c-hoja-fuerte);
		font-size: var(--fs-14);
		text-decoration: underline;
	}
	.tarea-acciones {
		display: flex;
		gap: var(--sp-2);
		align-items: center;
	}
	.foto-btn {
		cursor: pointer;
		min-width: 40px;
		padding: 0 var(--sp-2);
	}

	/* Compras form */
	.compras-form {
		display: flex;
		flex-direction: column;
		gap: var(--sp-2);
		flex: 1;
		max-width: 500px;
	}
	.compras-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--sp-2);
	}
	.compras-row label {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.compras-row input {
		font-size: var(--fs-14);
	}

	/* 3x rondas */
	.tarea-3x {
		flex-direction: column;
		align-items: stretch;
	}
	.rondas {
		display: flex;
		gap: var(--sp-3);
		flex-wrap: wrap;
	}
	.ronda-done,
	.ronda-pendiente {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
	}
	.ronda-circulo {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font: 700 var(--fs-18) var(--f-titulo);
		border: 2px solid var(--c-linea-fuerte);
		background: var(--c-blanco);
		cursor: pointer;
		transition: transform var(--dur-1);
	}
	.ronda-circulo:active {
		transform: scale(0.93);
	}
	.ronda-circulo.done {
		background: var(--c-listo, #2e7d32);
		color: #fff;
		border-color: var(--c-listo, #2e7d32);
		cursor: default;
	}
	.ronda-circulo.pendiente:hover {
		background: var(--c-arena);
	}
	.ronda-circulo.pendiente:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.foto-mini-btn {
		cursor: pointer;
		font-size: var(--fs-14);
		opacity: 0.6;
	}
	.foto-mini-btn:hover {
		opacity: 1;
	}
	.ronda-done small {
		color: var(--c-listo, #2e7d32);
		font-weight: 600;
		font-size: var(--fs-12);
	}

	@media (max-width: 600px) {
		.compras-row {
			grid-template-columns: 1fr;
		}
	}
</style>
