// Which notes started at a given moment, according to a neural network — the
// one way of hearing it that doesn't come apart under strings still ringing.
//
// The model is Spotify's Basic Pitch (public/models/basic-pitch, Apache-2.0;
// Bittner et al., ICASSP 2022): a 16,782-parameter network trained on real
// recordings (GuitarSet among them) that reads two seconds of audio and gives,
// for each of 88 pitches and ~86 frames a second, how likely a note of that
// pitch starts there. Our pitch detector follows one pitch, the loudest; the
// model sees every string at once — a B3 picked under a ringing B2, a string
// picked again while it rings, a chord's every tone.
//
// It only ever gets asked about the notes the tab expects, at the moment an
// attack was heard, and its answer only ever adds a way for a note to count —
// see learnModelCheck.ts. Inference runs in a worker (noteOnsetModel.worker.ts,
// ~180 ms per look on WASM). This file holds what needs no TensorFlow — the
// main thread imports it, and the model itself (noteOnsetInference.ts) must
// stay in the worker's bundle.

/** The model hears 22,050 Hz audio… */
export const MODEL_RATE = 22050;
/** …in fixed looks of this many samples (~1.99 s). */
export const MODEL_SAMPLES = 43844;
/** One output frame per 256 samples: ~86 a second. */
export const MODEL_FPS = MODEL_RATE / 256;
const MODEL_FRAMES = 172;
const KEYS = 88;
/** Key 0 is A0. */
const LOWEST_MIDI = 21;
/** How far around the attack's own timestamp an onset is looked for, in frames
 *  (−93…+70 ms): attacks are timed to a hop or so, a low one to a capture block. */
const SEARCH_BEFORE = 8;
const SEARCH_AFTER = 6;
/** How long one look lasts, in seconds. */
export const MODEL_SECONDS = MODEL_SAMPLES / MODEL_RATE;

/** One question: did a note of this pitch start this long before the end of the audio? */
export interface OnsetQuery {
  midi: number;
  secondsBeforeEnd: number;
}

/** The windowed-sinc taps for each fractional position a rational resampling meets. */
const kernelCache = new Map<string, { phases: Float32Array[]; half: number; step: number; denom: number }>();

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/**
 * Resamples with a Hann-windowed sinc low-pass, cut just under the lower of the
 * two Nyquists. Sample rates are whole numbers, so the fractional positions
 * repeat: their taps are worked out once per pair of rates.
 */
export function resample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return input.slice();
  const g = gcd(Math.round(fromRate), Math.round(toRate));
  const up = Math.round(toRate) / g; // output samples per…
  const down = Math.round(fromRate) / g; // …this many input samples
  const scale = Math.min(1, up / down);
  const key = `${fromRate}:${toRate}`;
  let kernel = kernelCache.get(key);
  if (!kernel) {
    const half = Math.ceil(8 / scale);
    const cutoff = 0.95 * scale;
    const phases: Float32Array[] = [];
    for (let p = 0; p < up; p++) {
      const frac = (p * down) / up - Math.floor((p * down) / up);
      const taps = new Float32Array(2 * half + 1);
      let sum = 0;
      for (let t = -half; t <= half; t++) {
        const x = t - frac;
        const sinc = x === 0 ? 1 : Math.sin(Math.PI * cutoff * x) / (Math.PI * cutoff * x);
        const w = 0.5 + 0.5 * Math.cos((Math.PI * x) / (half + 1));
        taps[t + half] = sinc * w;
        sum += taps[t + half];
      }
      for (let i = 0; i < taps.length; i++) taps[i] /= sum;
      phases.push(taps);
    }
    kernel = { phases, half, step: down, denom: up };
    kernelCache.set(key, kernel);
  }
  const { phases, half, step, denom } = kernel;
  const out = new Float32Array(Math.floor((input.length * up) / down));
  for (let n = 0; n < out.length; n++) {
    const base = Math.floor((n * step) / denom);
    const taps = phases[n % denom];
    let acc = 0;
    for (let t = -half; t <= half; t++) {
      const k = base + t;
      if (k >= 0 && k < input.length) acc += input[k] * taps[t + half];
    }
    out[n] = acc;
  }
  return out;
}

/** The model's look: the last MODEL_SAMPLES of `audio`, zeros in front if there isn't that much yet. */
export function lastLook(audio: Float32Array): Float32Array {
  if (audio.length >= MODEL_SAMPLES) return audio.slice(audio.length - MODEL_SAMPLES);
  const look = new Float32Array(MODEL_SAMPLES);
  look.set(audio, MODEL_SAMPLES - audio.length);
  return look;
}

/** The output frame a moment falls in, counted from the start of the look. */
export const frameOf = (secondsBeforeEnd: number): number =>
  Math.round((MODEL_SECONDS - secondsBeforeEnd) * MODEL_FPS);

/** The most likely onset of `midi` around `frame` (onsets: frames × 88 keys). */
export function onsetAround(onsets: Float32Array, midi: number, frame: number): number {
  const key = midi - LOWEST_MIDI;
  if (key < 0 || key >= KEYS) return 0;
  let best = 0;
  for (let f = Math.max(0, frame - SEARCH_BEFORE); f <= Math.min(MODEL_FRAMES - 1, frame + SEARCH_AFTER); f++) {
    best = Math.max(best, onsets[f * KEYS + key]);
  }
  return best;
}

/** The nearest MIDI note to a frequency. */
export const midiOf = (freq: number): number => Math.round(69 + 12 * Math.log2(freq / 440));

/** What the main thread sends the worker. */
export interface OnsetModelRequest {
  id: number;
  modelUrl: string;
  wasmPath: string;
  samples: Float32Array;
  sampleRate: number;
  queries: OnsetQuery[];
}

/** What it sends back: the probabilities, or why there are none. */
export type OnsetModelResponse = { id: number; probabilities: number[] } | { id: number; error: string };
