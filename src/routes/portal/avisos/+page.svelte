<script lang="ts">
	import { onMount } from 'svelte';
	import { api, type AvisosResp } from '$lib/api';
	import Icono from '$lib/portal/Icono.svelte';

	let datos = $state<AvisosResp | null>(null);
	let error = $state('');
	let nuevoFaltante = $state('');
	let enviando = $state(false);

	const ZONAS = [
		{ id: 'cocina', nombre: 'Cocina' },
		{ id: 'bano', nombre: 'Baño' },
		{ id: 'mesas', nombre: 'Mesas' },
		{ id: 'general', nombre: 'General' }
	];

	async function cargar() {
		try { datos = await api.avisos(); } catch (e) { error = (e as Error).message; }
	}

	async function registrarAsistencia(usuarioId: number, tipo: 'entrada' | 'salida') {
		try {
			await api.checkin(usuarioId, tipo);
			await cargar();
		} catch (e) { error = (e as Error).message; }
	}

	async function agregarFaltante() {
		if (!nuevoFaltante.trim()) return;
		enviando = true;
		try {
			await api.crearFaltante(nuevoFaltante.trim());
			nuevoFaltante = '';
			await cargar();
		} catch (e) { error = (e as Error).message; }
		enviando = false;
	}

	async function toggleFaltante(id: number, resuelto: boolean) {
		try {
			await api.resolverFaltante(id, resuelto);
			await cargar();
		} catch (e) { error = (e as Error).message; }
	}

	async function subirFoto(zona: string, e: Event) {
		const input = e.target as HTMLInputElement;
		const archivo = input.files?.[0];
		if (!archivo) return;
		try {
			await api.subirFoto(zona, archivo);
			await cargar();
		} catch (err) { error = (err as Error).message; }
		input.value = '';
	}

	function hora(ts: number | null) {
		if (!ts) return '—';
		return new Date(ts).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' });
	}

	function entradaDe(usuarioId: number) {
		return datos?.registros.find(r => r.usuarioId === usuarioId)?.entrada ?? null;
	}
	function salidaDe(usuarioId: number) {
		return datos?.registros.find(r => r.usuarioId === usuarioId)?.salida ?? null;
	}
	function fotoDeZona(zona: string) {
		return datos?.fotos.filter(f => f.zona === zona) ?? [];
	}

	onMount(cargar);
</script>

<div class="pagina">
	<h1>Avisos del día</h1>
	{#if error}<p class="error">{error}</p>{/if}

	{#if datos}
		<!-- ASISTENCIA -->
		<div class="panel">
			<h2>Asistencia del personal</h2>
			<table>
				<thead><tr><th>Nombre</th><th>Entrada</th><th>Salida</th><th>Acciones</th></tr></thead>
				<tbody>
					{#each datos.usuarios as u (u.id)}
						<tr>
							<td><strong>{u.nombre}</strong></td>
							<td class:registrado={!!entradaDe(u.id)}>{hora(entradaDe(u.id))}</td>
							<td class:registrado={!!salidaDe(u.id)}>{hora(salidaDe(u.id))}</td>
							<td class="acciones">
								{#if !entradaDe(u.id)}
									<button class="btn chico" onclick={() => registrarAsistencia(u.id, 'entrada')}>Registrar entrada</button>
								{:else if !salidaDe(u.id)}
									<button class="btn chico sec" onclick={() => registrarAsistencia(u.id, 'salida')}>Registrar salida</button>
								{:else}
									<span class="chip entregado">Completo</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- FOTOS DE LIMPIEZA -->
		<div class="panel">
			<h2>Fotos de limpieza</h2>
			<p class="sub">Sube una foto de cada zona para verificar que todo esté limpio.</p>
			<div class="zonas">
				{#each ZONAS as z (z.id)}
					<div class="zona-card">
						<h3>{z.nombre}</h3>
						{#if fotoDeZona(z.id).length > 0}
							<div class="fotos-mini">
								{#each fotoDeZona(z.id) as f (f.id)}
									<img src="/api/avisos/fotos/{f.ruta}" alt="{z.nombre}" />
								{/each}
							</div>
							<span class="chip listo">Subida</span>
						{:else}
							<span class="chip nuevo">Pendiente</span>
						{/if}
						<label class="btn chico sec subir">
							<Icono nombre="plus" /> Subir foto
							<input type="file" accept="image/*" capture="environment" onchange={(e) => subirFoto(z.id, e)} hidden />
						</label>
					</div>
				{/each}
			</div>
		</div>

		<!-- INGREDIENTES FALTANTES -->
		<div class="panel">
			<h2>Ingredientes faltantes</h2>
			<div class="fila-agregar">
				<input type="text" bind:value={nuevoFaltante} placeholder="Ej: Aguacate, Limones..." maxlength="200" onkeydown={(e) => e.key === 'Enter' && agregarFaltante()} />
				<button class="btn" disabled={enviando} onclick={agregarFaltante}>Agregar</button>
			</div>
			{#if datos.faltantes.length === 0}
				<p class="vacio">No hay ingredientes faltantes reportados hoy.</p>
			{:else}
				<ul class="lista-faltantes">
					{#each datos.faltantes as f (f.id)}
						<li class:resuelto={f.resuelto}>
							<label>
								<input type="checkbox" checked={f.resuelto} onchange={() => toggleFaltante(f.id, !f.resuelto)} />
								<span>{f.nombre}</span>
							</label>
							<small>{hora(f.creadoEn)}</small>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{:else if !error}
		<p>Cargando...</p>
	{/if}
</div>

<style>
	h2 { margin-bottom: var(--sp-3); }
	.sub { margin: 0 0 var(--sp-3); font-size: var(--fs-14); color: var(--c-texto-suave); }
	.registrado { color: var(--c-listo); font-weight: 600; }
	.acciones { white-space: nowrap; }

	/* Zonas de limpieza */
	.zonas { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--sp-4); }
	.zona-card { background: var(--c-arena); border-radius: var(--r-md); padding: var(--sp-4); display: flex; flex-direction: column; gap: var(--sp-2); align-items: flex-start; }
	.zona-card h3 { margin: 0; font-size: var(--fs-18); }
	.fotos-mini { display: flex; gap: var(--sp-2); flex-wrap: wrap; }
	.fotos-mini img { width: 80px; height: 60px; object-fit: cover; border-radius: var(--r-sm); border: 1px solid var(--c-linea); }
	.subir { cursor: pointer; margin-top: var(--sp-2); }

	/* Faltantes */
	.fila-agregar { display: flex; gap: var(--sp-3); margin-bottom: var(--sp-3); }
	.fila-agregar input { flex: 1; }
	.lista-faltantes { list-style: none; margin: 0; padding: 0; }
	.lista-faltantes li { display: flex; align-items: center; justify-content: space-between; padding: var(--sp-2) 0; border-bottom: 1px solid var(--c-linea); }
	.lista-faltantes label { display: flex; gap: var(--sp-2); align-items: center; cursor: pointer; }
	.lista-faltantes input[type="checkbox"] { min-height: 0; width: 20px; height: 20px; accent-color: var(--c-hoja-fuerte); }
	.resuelto span { text-decoration: line-through; color: var(--c-texto-suave); }
	small { color: var(--c-texto-suave); font-size: var(--fs-12); }
</style>
