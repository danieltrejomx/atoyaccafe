// Campana (WebAudio, sin archivos) y voz es-MX. La cola evita que dos anuncios se pisen.
let ctx: AudioContext | undefined;

export function desbloquearAudio() {
	try {
		ctx ??= new AudioContext();
		void ctx.resume();
		speechSynthesis?.getVoices();
	} catch {
		/* sin audio disponible */
	}
}

export function campana() {
	if (!ctx) return;
	const t = ctx.currentTime;
	for (const [f, d] of [[880, 0], [1318, 0.18]] as const) {
		const o = ctx.createOscillator();
		const g = ctx.createGain();
		o.type = 'sine';
		o.frequency.value = f;
		g.gain.setValueAtTime(0.0001, t + d);
		g.gain.exponentialRampToValueAtTime(0.5, t + d + 0.02);
		g.gain.exponentialRampToValueAtTime(0.0001, t + d + 1.2);
		o.connect(g).connect(ctx.destination);
		o.start(t + d);
		o.stop(t + d + 1.3);
	}
}

export function hablar(texto: string) {
	if (typeof speechSynthesis === 'undefined') return;
	const u = new SpeechSynthesisUtterance(texto);
	u.lang = 'es-MX';
	u.rate = 0.9;
	const voz = speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-') === 'es-MX');
	if (voz) u.voice = voz;
	speechSynthesis.speak(u);
}

/** Ejecuta `correr(item)` de uno en uno, dejando `espera` ms entre el inicio de cada uno. */
export function crearCola<T>(correr: (item: T) => void, espera: number) {
	const pendientes: T[] = [];
	let ocupado = false;
	function siguiente() {
		const item = pendientes.shift();
		if (item === undefined) {
			ocupado = false;
			return;
		}
		correr(item);
		setTimeout(siguiente, espera);
	}
	return {
		agregar(item: T) {
			pendientes.push(item);
			if (!ocupado) {
				ocupado = true;
				siguiente();
			}
		}
	};
}
