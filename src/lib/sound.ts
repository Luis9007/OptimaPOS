/**
 * @file sound.ts
 * @description Utilidades de Síntesis de Sonido Nativas vía Web Audio API.
 * 
 * CARACTERÍSTICAS:
 * - 100% Offline: No requiere cargar archivos .mp3 externos ni peticiones de red.
 * - Sin latencia: Síntesis inmediata mediante osciladores de onda senoidal y cuadrada.
 * - Sonidos diferenciados: Tono de confirmación (éxito) y tono grave doble (error / sin stock).
 */

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        sharedAudioCtx = new AudioCtx();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Emite un bip agudo y limpio (~988 Hz) indicando lectura o acción exitosa.
 */
export function playSuccessBeep() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, ctx.currentTime); // Nota Si5 (B5)
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Silencioso en caso de bloqueo de audio por políticas de navegador
  }
}

/**
 * Emite un doble tono grave descendente (~320 Hz -> 220 Hz)
 * para alertar cuando un producto no existe o está agotado (stock 0).
 */
export function playErrorBeep() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Primer pulso grave
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(320, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.10);

    // Segundo pulso más grave para marcar advertencia clara
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(220, now + 0.12);
    gain2.gain.setValueAtTime(0.18, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.28);
  } catch {
    // Silencioso en caso de bloqueo de audio
  }
}

// Alias de retrocompatibilidad
export const playBeep = playSuccessBeep;
