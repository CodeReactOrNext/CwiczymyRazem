/**
 * The fight's sound effects, synthesised with Web Audio like the UI sounds.
 *
 * The microphone is open while they play, so everything heard during a run is
 * filtered noise — a tick, a whoosh, a thud — with no steady pitch for the
 * note detector to take for a string, short, and (the countdowns) on the beat,
 * where the metronome is clicking anyway. Only the cues of a break or a lost
 * run, when no note counts, are tuned.
 */
export type BossCue =
  /** A countdown tick before a slam or a quake; louder and higher step by step. */
  | "tick"
  /** The last tick — the attack comes on the next beat (or, a quake, now). */
  | "tickLast"
  /** The sword strikes. */
  | "strike"
  /** A slam or a quake blocked. */
  | "block"
  /** A slam or a quake that lands. */
  | "impact"
  /** A changeling trick strung onto the combo. */
  | "trick"
  /** The combo pays out. */
  | "bank"
  /** A bite taken — only the band answers it (it dips); on its own, silence. */
  | "hurt"
  /** The boss changes form between phases. */
  | "molt"
  /** It changes form at a gate. */
  | "gate"
  /** The run is lost. */
  | "defeat";

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

/** A second of white noise per context, played from a random point each time. */
const noiseFor = (ctx: BaseAudioContext) => {
  let buffer = noiseBuffers.get(ctx);
  if (!buffer) {
    buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ctx, buffer);
  }
  return buffer;
};

interface Burst {
  /** Seconds the burst lasts. */
  length: number;
  peak: number;
  attack?: number;
  filter: BiquadFilterType;
  frequency: number;
  /** Where the filter has swept to by the end. */
  sweepTo?: number;
  q?: number;
}

/** Filtered noise with a fast rise and an exponential fall. */
const burst = (ctx: BaseAudioContext, out: AudioNode, at: number, b: Burst) => {
  const source = ctx.createBufferSource();
  source.buffer = noiseFor(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = b.filter;
  filter.Q.value = b.q ?? 1;
  filter.frequency.setValueAtTime(b.frequency, at);
  if (b.sweepTo) filter.frequency.exponentialRampToValueAtTime(b.sweepTo, at + b.length);
  const gain = ctx.createGain();
  const attack = b.attack ?? 0.003;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(b.peak, at + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + b.length);
  source.connect(filter).connect(gain).connect(out);
  source.start(at, Math.random() * 0.5);
  source.stop(at + b.length + 0.02);
  source.onended = () => {
    source.disconnect();
    filter.disconnect();
    gain.disconnect();
  };
};

/** A sine whose pitch falls — only for the cues of a held run. */
const fall = (
  ctx: BaseAudioContext,
  out: AudioNode,
  at: number,
  from: number,
  to: number,
  length: number,
  peak: number,
) => {
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + length);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(gain).connect(out);
  osc.start(at);
  osc.stop(at + length + 0.02);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
};

/** A gong's inharmonic partials, Hz, and their levels. */
const GONG: readonly (readonly [number, number])[] = [
  [98, 1],
  [167, 0.6],
  [233, 0.45],
  [316, 0.3],
  [421, 0.2],
];

/**
 * Schedules `cue` on `ctx` at audio time `at`, into `out`. `step` raises a
 * tick through a countdown (0 = its first).
 */
export const scheduleCue = (ctx: BaseAudioContext, out: AudioNode, cue: BossCue, at: number, step = 0) => {
  switch (cue) {
    case "tick":
      burst(ctx, out, at, { filter: "bandpass", frequency: 1900 * 1.2 ** step, q: 5, length: 0.05, peak: 0.9 + 0.2 * step });
      return;
    case "tickLast":
      burst(ctx, out, at, { filter: "bandpass", frequency: 3600, q: 4, length: 0.07, peak: 0.85 });
      burst(ctx, out, at, { filter: "lowpass", frequency: 1600, q: 0.5, length: 0.08, peak: 0.3 });
      return;
    case "strike":
      // A blade through the air, and the bite of its edge.
      burst(ctx, out, at, {
        filter: "bandpass",
        frequency: 900,
        sweepTo: 5000,
        q: 0.9,
        length: 0.14,
        peak: 0.4,
        attack: 0.03,
      });
      return;
    case "block":
      // A shield rung twice, bright and short.
      burst(ctx, out, at, { filter: "highpass", frequency: 3800, length: 0.09, peak: 0.18 });
      burst(ctx, out, at + 0.035, { filter: "bandpass", frequency: 5200, q: 3, length: 0.07, peak: 0.1 });
      return;
    case "impact":
      // Broadband, so it has a weight but no pitch: a narrow low thud read as a C4.
      burst(ctx, out, at, { filter: "lowpass", frequency: 2400, q: 0.4, length: 0.16, peak: 0.45 });
      burst(ctx, out, at, { filter: "highpass", frequency: 2500, length: 0.06, peak: 0.2 });
      return;
    case "trick":
      // Two quick glints, high above any string.
      burst(ctx, out, at, { filter: "highpass", frequency: 6500, length: 0.045, peak: 0.16 });
      burst(ctx, out, at + 0.06, { filter: "highpass", frequency: 8000, length: 0.05, peak: 0.13 });
      return;
    case "bank":
      // A rising rush that breaks into a crack.
      burst(ctx, out, at, {
        filter: "bandpass",
        frequency: 1400,
        sweepTo: 7000,
        q: 0.7,
        length: 0.18,
        peak: 0.3,
        attack: 0.06,
      });
      burst(ctx, out, at + 0.17, { filter: "highpass", frequency: 3000, length: 0.12, peak: 0.3 });
      return;
    case "hurt":
      return;
    case "molt":
      burst(ctx, out, at, {
        filter: "lowpass",
        frequency: 3200,
        sweepTo: 180,
        q: 2,
        length: 0.8,
        peak: 0.16,
        attack: 0.05,
      });
      return;
    case "gate": {
      for (const [frequency, level] of GONG) {
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(frequency, at);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.06 * level, at + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 2.2 - frequency / 400);
        osc.connect(gain).connect(out);
        osc.start(at);
        osc.stop(at + 2.3);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      }
      burst(ctx, out, at, { filter: "lowpass", frequency: 400, length: 0.3, peak: 0.25 });
      return;
    }
    case "defeat":
      fall(ctx, out, at, 220, 65, 1.3, 0.09);
      burst(ctx, out, at, { filter: "lowpass", frequency: 900, sweepTo: 120, length: 1.1, peak: 0.12, attack: 0.08 });
      return;
  }
};
