/**
 * What the editor needs to know about a recording beyond its outline: where
 * the attacks are, and which notes sound when.
 *
 * Pure number crunching, no DOM — it runs in a worker (see
 * recordingAnalysis.worker.ts) and in tests alike.
 */

/** The rate recordings are decoded at for analysis. 8 kHz — what the drawn
 *  waveform used to be decoded at — cuts everything above 4 kHz, which is
 *  most of a snare's crack and all of the cymbals. */
export const ANALYSIS_SAMPLE_RATE = 22_050;

/** Attack detection: a short window, stepped finely, so a bar line can land
 *  within a few milliseconds of the hit. */
const ONSET_FRAME = 512;
const ONSET_HOP = 128;
export const ONSET_FPS = ANALYSIS_SAMPLE_RATE / ONSET_HOP;

/** Pitch content: a long window for frequency resolution, on a signal at half
 *  the analysis rate — the same resolution for a quarter of the work. */
const CHROMA_RATE = ANALYSIS_SAMPLE_RATE / 2;
const CHROMA_FRAME = 2048;
const CHROMA_HOP = 256;
export const CHROMA_FPS = CHROMA_RATE / CHROMA_HOP;
const CHROMA_MIN_HZ = 55;
const CHROMA_MAX_HZ = 1760;

/** Log compression of magnitudes before differencing — quiet attacks count. */
const FLUX_COMPRESSION = 100;
/** Seconds of local average subtracted from the flux, so a loud chorus does
 *  not drown the attacks around it. */
const FLUX_MEAN_WINDOW_SEC = 0.1;

export interface RecordingFeatures {
  /** Attack strength per frame, 0..1, frame i at i / onsetFps seconds. */
  onset: Float32Array;
  /** The same in three bands — kick and bass, snare and guitars, cymbals.
   *  Optional so older callers (and test fixtures) can leave them out. */
  onsetLow?: Float32Array;
  onsetMid?: Float32Array;
  onsetHigh?: Float32Array;
  onsetFps: number;
  /** 12 pitch-class strengths per frame (C, C#, … B), each frame unit length
   *  or all zero in silence. */
  chroma: Float32Array;
  chromaFps: number;
  durationSec: number;
}

// ── FFT ───────────────────────────────────────────────────────────────────

interface FftPlan {
  n: number;
  cos: Float64Array;
  sin: Float64Array;
  rev: Uint32Array;
  window: Float64Array;
}

const plans = new Map<number, FftPlan>();

function planFor(n: number): FftPlan {
  const cached = plans.get(n);
  if (cached) return cached;
  const bits = Math.log2(n);
  const rev = new Uint32Array(n);
  for (let i = 0; i < n; i += 1) {
    let r = 0;
    for (let b = 0; b < bits; b += 1) r |= ((i >> b) & 1) << (bits - 1 - b);
    rev[i] = r;
  }
  const cos = new Float64Array(n / 2);
  const sin = new Float64Array(n / 2);
  for (let k = 0; k < n / 2; k += 1) {
    cos[k] = Math.cos((2 * Math.PI * k) / n);
    sin[k] = Math.sin((2 * Math.PI * k) / n);
  }
  const window = new Float64Array(n);
  for (let i = 0; i < n; i += 1) window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n);
  const plan = { n, cos, sin, rev, window };
  plans.set(n, plan);
  return plan;
}

/** In-place radix-2 FFT. `inverse` conjugates the twiddles; no 1/n scaling. */
export function fft(re: Float64Array, im: Float64Array, inverse = false): void {
  const { n, cos, sin, rev } = planFor(re.length);
  for (let i = 0; i < n; i += 1) {
    const j = rev[i];
    if (j > i) {
      const tr = re[i];
      re[i] = re[j];
      re[j] = tr;
      const ti = im[i];
      im[i] = im[j];
      im[j] = ti;
    }
  }
  const sign = inverse ? 1 : -1;
  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1;
    const step = n / size;
    for (let start = 0; start < n; start += size) {
      for (let k = 0; k < half; k += 1) {
        const wr = cos[k * step];
        const wi = sign * sin[k * step];
        const a = start + k;
        const b = a + half;
        const tr = re[b] * wr - im[b] * wi;
        const ti = re[b] * wi + im[b] * wr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
      }
    }
  }
}

/**
 * Magnitude spectra of two real frames for the price of one complex FFT: the
 * first frame goes in as the real part, the second as the imaginary part, and
 * the symmetry of a real signal's spectrum pulls them apart again.
 */
function framePairMagnitudes(
  signal: Float32Array,
  startA: number,
  startB: number,
  plan: FftPlan,
  re: Float64Array,
  im: Float64Array,
  outA: Float64Array,
  outB: Float64Array,
): void {
  const { n, window } = plan;
  for (let i = 0; i < n; i += 1) {
    const ia = startA + i;
    const ib = startB + i;
    re[i] = (ia < signal.length ? signal[ia] : 0) * window[i];
    im[i] = (startB >= 0 && ib < signal.length ? signal[ib] : 0) * window[i];
  }
  fft(re, im);
  const halfN = n / 2;
  for (let k = 0; k <= halfN; k += 1) {
    const m = (n - k) % n;
    const ar = (re[k] + re[m]) / 2;
    const ai = (im[k] - im[m]) / 2;
    const br = (im[k] + im[m]) / 2;
    const bi = (re[m] - re[k]) / 2;
    outA[k] = Math.sqrt(ar * ar + ai * ai);
    outB[k] = Math.sqrt(br * br + bi * bi);
  }
}

/** Runs `onFrame(index, magnitudes)` over every frame of `signal`, in order. */
function forEachSpectrum(
  signal: Float32Array,
  frame: number,
  hop: number,
  onFrame: (index: number, magnitudes: Float64Array) => void,
): number {
  const plan = planFor(frame);
  const frames = Math.max(1, Math.ceil(signal.length / hop));
  const re = new Float64Array(frame);
  const im = new Float64Array(frame);
  const magA = new Float64Array(frame / 2 + 1);
  const magB = new Float64Array(frame / 2 + 1);
  for (let t = 0; t < frames; t += 2) {
    const hasB = t + 1 < frames;
    framePairMagnitudes(signal, t * hop, hasB ? (t + 1) * hop : -1, plan, re, im, magA, magB);
    onFrame(t, magA);
    if (hasB) onFrame(t + 1, magB);
  }
  return frames;
}

/**
 * How far the flux is shifted so its peaks land on the hits: raw, it peaks
 * three frames (~17 ms) early, because log compression registers an attack as
 * soon as the window starts to take it in. Measured on synthetic hits — the
 * test in audioFeatures.test.ts pins it to within a few milliseconds.
 */
export const ONSET_LAG_FRAMES = -3;

/** Scales so the loudest attacks sit near 1 — robust to one freak spike. */
function normalise(values: Float32Array): Float32Array {
  if (values.length === 0) return values;
  const sorted = Float32Array.from(values).sort();
  const reference = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.995))] || 0;
  const peak = reference > 0 ? reference : sorted[sorted.length - 1];
  if (!(peak > 0)) return values;
  for (let i = 0; i < values.length; i += 1) values[i] = Math.min(1, values[i] / peak);
  return values;
}

// ── Attacks ───────────────────────────────────────────────────────────────

/** Where in the spectrum each instrument's attack is loudest, in Hz. */
const BANDS = {
  /** Kick drum and bass. */
  low: [30, 160],
  /** Snare body, guitars, vocals. */
  mid: [160, 2500],
  /** Hi-hats and cymbals. */
  high: [5000, ANALYSIS_SAMPLE_RATE / 2],
} as const;

export interface OnsetBands {
  /** Every attack, whatever played it. */
  all: Float32Array;
  low: Float32Array;
  mid: Float32Array;
  high: Float32Array;
}

/** Local mean removed, shifted onto the hit, scaled to 0..1 — see onsetEnvelopes. */
function finishFlux(flux: Float32Array): Float32Array {
  const frames = flux.length;
  const half = Math.max(1, Math.round((FLUX_MEAN_WINDOW_SEC * ONSET_FPS) / 2));
  const out = new Float32Array(frames);
  let windowSum = 0;
  let windowCount = 0;
  for (let i = 0; i < Math.min(frames, half); i += 1) {
    windowSum += flux[i];
    windowCount += 1;
  }
  for (let i = 0; i < frames; i += 1) {
    const enter = i + half;
    if (enter < frames) {
      windowSum += flux[enter];
      windowCount += 1;
    }
    const leave = i - half - 1;
    if (leave >= 0) {
      windowSum -= flux[leave];
      windowCount -= 1;
    }
    out[i] = Math.max(0, flux[i] - windowSum / windowCount);
  }

  // Shift so a peak lands on the attack, not where the window first saw it.
  const aligned = new Float32Array(frames);
  for (let i = 0; i < frames; i += 1) {
    const from = i + ONSET_LAG_FRAMES;
    aligned[i] = from >= 0 && from < frames ? out[from] : 0;
  }
  return normalise(aligned);
}

/**
 * Attack strength over time — spectral flux: how much new energy arrived in
 * each frame after log compression — overall and in three bands.
 *
 * The bands are what tell a drum part apart from a shifted copy of itself. A
 * hi-hat on every eighth fits anywhere on the eighth grid; a kick on one and
 * three and a snare on two and four only fit one way, and they only show up
 * as different things once the low end and the middle are read separately.
 *
 * Index i is aligned to i / ONSET_FPS seconds; peaks sit on the hits (see the
 * test that pins ONSET_LAG_FRAMES).
 */
export function onsetEnvelopes(samples: Float32Array): OnsetBands {
  const bins = ONSET_FRAME / 2 + 1;
  const binHz = ANALYSIS_SAMPLE_RATE / ONSET_FRAME;
  const bandOf = new Int8Array(bins).fill(-1);
  (["low", "mid", "high"] as const).forEach((band, index) => {
    const [from, to] = BANDS[band];
    for (let k = 1; k < bins; k += 1) {
      const hz = k * binHz;
      if (hz >= from && hz < to) bandOf[k] = index;
    }
  });

  let previous = new Float64Array(bins);
  let current = new Float64Array(bins);
  const frames = Math.max(1, Math.ceil(samples.length / ONSET_HOP));
  const flux = [new Float32Array(frames), new Float32Array(frames), new Float32Array(frames)];
  const all = new Float32Array(frames);

  forEachSpectrum(samples, ONSET_FRAME, ONSET_HOP, (t, magnitudes) => {
    let sum = 0;
    for (let k = 1; k < bins; k += 1) {
      const value = Math.log1p(FLUX_COMPRESSION * magnitudes[k]);
      current[k] = value;
      const rise = value - previous[k];
      if (rise > 0 && t > 0) {
        sum += rise;
        const band = bandOf[k];
        if (band >= 0) flux[band][t] += rise;
      }
    }
    all[t] = sum;
    const swap = previous;
    previous = current;
    current = swap;
  });

  return {
    all: finishFlux(all),
    low: finishFlux(flux[0]),
    mid: finishFlux(flux[1]),
    high: finishFlux(flux[2]),
  };
}

/** Every attack, whatever played it — see onsetEnvelopes. */
export function onsetEnvelope(samples: Float32Array): Float32Array {
  return onsetEnvelopes(samples).all;
}

// ── Pitch classes ─────────────────────────────────────────────────────────

/** Halves the rate, with a gentle low-pass first so the top folds down quietly. */
function halfRate(samples: Float32Array): Float32Array {
  const out = new Float32Array(Math.floor(samples.length / 2));
  for (let i = 0; i < out.length; i += 1) {
    const c = 2 * i;
    const before = c > 0 ? samples[c - 1] : samples[c];
    const after = c + 1 < samples.length ? samples[c + 1] : samples[c];
    out[i] = 0.25 * before + 0.5 * samples[c] + 0.25 * after;
  }
  return out;
}

/** 12 numbers per frame: how much of each pitch class is sounding. */
export function chromagram(samples: Float32Array): Float32Array {
  const signal = halfRate(samples);
  const bins = CHROMA_FRAME / 2 + 1;
  const pitchClassOf = new Int8Array(bins).fill(-1);
  for (let k = 1; k < bins; k += 1) {
    const hz = (k * CHROMA_RATE) / CHROMA_FRAME;
    if (hz < CHROMA_MIN_HZ || hz > CHROMA_MAX_HZ) continue;
    const midi = Math.round(69 + 12 * Math.log2(hz / 440));
    pitchClassOf[k] = ((midi % 12) + 12) % 12;
  }

  const frames = Math.max(1, Math.ceil(signal.length / CHROMA_HOP));
  const chroma = new Float32Array(frames * 12);
  let loudest = 0;
  const energies = new Float32Array(frames);
  forEachSpectrum(signal, CHROMA_FRAME, CHROMA_HOP, (t, magnitudes) => {
    const base = t * 12;
    let energy = 0;
    for (let k = 1; k < bins; k += 1) {
      const pc = pitchClassOf[k];
      if (pc < 0) continue;
      const value = Math.log1p(FLUX_COMPRESSION * magnitudes[k]);
      chroma[base + pc] += value;
      energy += value;
    }
    energies[t] = energy;
    if (energy > loudest) loudest = energy;
  });

  // Unit length per frame; near-silent frames say nothing rather than noise.
  for (let t = 0; t < frames; t += 1) {
    const base = t * 12;
    if (energies[t] < loudest * 0.02) {
      chroma.fill(0, base, base + 12);
      continue;
    }
    let norm = 0;
    for (let c = 0; c < 12; c += 1) norm += chroma[base + c] * chroma[base + c];
    norm = Math.sqrt(norm);
    if (norm > 0) for (let c = 0; c < 12; c += 1) chroma[base + c] /= norm;
  }
  return chroma;
}

/** Everything the editor reads off a recording, from one mono decode. */
export function analyseRecording(samples: Float32Array): RecordingFeatures {
  const onsets = onsetEnvelopes(samples);
  return {
    onset: onsets.all,
    onsetLow: onsets.low,
    onsetMid: onsets.mid,
    onsetHigh: onsets.high,
    onsetFps: ONSET_FPS,
    chroma: chromagram(samples),
    chromaFps: CHROMA_FPS,
    durationSec: samples.length / ANALYSIS_SAMPLE_RATE,
  };
}

/**
 * The strongest attack within `toleranceSec` of `sec`, or null when nothing
 * there stands out as one.
 */
export function snapToOnset(params: {
  sec: number;
  onset: Float32Array | null;
  onsetFps: number;
  toleranceSec: number;
  /** Below this the "attack" is just the noise floor. */
  minStrength?: number;
}): number | null {
  const { sec, onset, onsetFps, toleranceSec, minStrength = 0.12 } = params;
  if (!onset || onset.length < 3 || !Number.isFinite(sec) || !(toleranceSec > 0)) return null;
  const first = Math.max(1, Math.ceil((sec - toleranceSec) * onsetFps));
  const last = Math.min(onset.length - 2, Math.floor((sec + toleranceSec) * onsetFps));
  let best = -1;
  let bestValue = minStrength;
  for (let i = first; i <= last; i += 1) {
    const value = onset[i];
    // Local peaks only — the shoulder of a big hit is not a hit of its own.
    if (value < bestValue || value < onset[i - 1] || value <= onset[i + 1]) continue;
    best = i;
    bestValue = value;
  }
  return best < 0 ? null : best / onsetFps;
}
