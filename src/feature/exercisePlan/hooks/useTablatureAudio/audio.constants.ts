// ── Open-string MIDI note numbers ─────────────────────────────────────────────
// string 1 → E4 (64), 2 → B3 (59), 3 → G3 (55), 4 → D3 (50), 5 → A2 (45), 6 → E2 (40)
export const GUITAR_STRING_MIDI = [64, 59, 55, 50, 45, 40];
// string 1 → G2 (43), 2 → D2 (38), 3 → A1 (33), 4 → E1 (28)
export const BASS_STRING_MIDI   = [43, 38, 33, 28];

export const GUITAR_STRING_FREQS = [329.63, 246.94, 196.00, 146.83, 110.00,  82.41];
export const BASS_STRING_FREQS   = [ 98.00,  73.42,  55.00,  41.20];

// ── Noise buffer ──────────────────────────────────────────────────────────────

function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const len = Math.max(1, Math.ceil(ctx.sampleRate * duration));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

// WeakMap so cache is GC'd when the AudioContext closes.
const _noiseCache = new WeakMap<AudioContext, Map<number, AudioBuffer>>();

export function getCachedNoiseBuffer(ctx: AudioContext, durationMs: number): AudioBuffer {
  let ctxMap = _noiseCache.get(ctx);
  if (!ctxMap) { ctxMap = new Map(); _noiseCache.set(ctx, ctxMap); }
  let buf = ctxMap.get(durationMs);
  if (!buf) { buf = createNoiseBuffer(ctx, durationMs / 1000); ctxMap.set(durationMs, buf); }
  return buf;
}

// ── Waveshaper curves ─────────────────────────────────────────────────────────

function makeSoftClipCurve(samples = 512, drive = 2.0): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(samples) as Float32Array<ArrayBuffer>;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
  }
  return curve;
}

export const SOFT_CLIP_CURVE       = makeSoftClipCurve(512, 2.0); // heavy drive (drums)
export const SOFT_CLIP_CURVE_LIGHT = makeSoftClipCurve(512, 0.7); // gentle warmth (strings)
