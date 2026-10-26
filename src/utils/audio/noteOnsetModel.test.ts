// @vitest-environment node
//
// The note-onset model itself — the files the app serves (public/models), the
// WASM engine it runs on, the code its worker runs — on the moments the pitch
// detector gets wrong. Strings are Karplus–Strong started from a pick's triangle.

import "@tensorflow/tfjs-backend-wasm";

import type { GraphModel } from "@tensorflow/tfjs-converter";
import { loadGraphModel } from "@tensorflow/tfjs-converter";
import * as tf from "@tensorflow/tfjs-core";
import fs from "fs";
import path from "path";
import { beforeAll, describe, expect, it } from "vitest";

import { onsetProbabilities } from "./noteOnsetInference";
import { frameOf, lastLook, MODEL_SAMPLES, onsetAround, resample } from "./noteOnsetModel";

const RATE = 48000;
const midiHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

describe("resample", () => {
  it("keeps a tone's pitch and level going down to the model's rate", () => {
    const sine = Float32Array.from({ length: RATE }, (_, n) => 0.5 * Math.sin((2 * Math.PI * 440 * n) / RATE));
    const out = resample(sine, RATE, 22050);
    expect(out.length).toBe(22050);
    let crossings = 0;
    for (let i = 1000; i < out.length - 1000; i++) if (out[i - 1] < 0 && out[i] >= 0) crossings++;
    expect(crossings / ((out.length - 2000) / 22050)).toBeCloseTo(440, -1);
    let peak = 0;
    for (let i = 1000; i < out.length - 1000; i++) peak = Math.max(peak, Math.abs(out[i]));
    expect(peak).toBeCloseTo(0.5, 1);
  });

  it("filters out what the lower rate can't hold, instead of folding it down", () => {
    const high = Float32Array.from({ length: RATE }, (_, n) => 0.5 * Math.sin((2 * Math.PI * 15000 * n) / RATE));
    const out = resample(high, RATE, 22050);
    let peak = 0;
    for (let i = 1000; i < out.length - 1000; i++) peak = Math.max(peak, Math.abs(out[i]));
    expect(peak).toBeLessThan(0.05);
  });
});

describe("reading the output", () => {
  it("places a moment on the look's frames, counted back from its end", () => {
    expect(frameOf(0)).toBe(171);
    expect(frameOf(1)).toBe(85);
    expect(lastLook(new Float32Array(10)).length).toBe(MODEL_SAMPLES);
  });

  it("takes the strongest onset of the note around the frame, and none of another", () => {
    const onsets = new Float32Array(172 * 88);
    onsets[100 * 88 + (59 - 21)] = 0.9; // B3 at frame 100
    expect(onsetAround(onsets, 59, 95)).toBeCloseTo(0.9);
    expect(onsetAround(onsets, 59, 120)).toBe(0);
    expect(onsetAround(onsets, 58, 100)).toBe(0);
  });
});

// ── The model on a synthetic guitar ────────────────────────────────────────

let seed = 5;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xffffffff; };

/** A string picked at `atSec`, damped at `stopSec`; `smooth` darkens it (thumb, neck pickup). */
function pluck(out: Float32Array, atSec: number, midi: number, gain: number, stopSec = Infinity, smooth = 0.4) {
  const period = Math.round(RATE / midiHz(midi) - 0.5);
  const line = new Float32Array(period);
  const at = 0.15 + rnd() * 0.12;
  let mean = 0;
  for (let i = 0; i < period; i++) { const x = i / period; line[i] = x < at ? x / at : (1 - x) / (1 - at); mean += line[i] / period; }
  let s = 0;
  for (let i = 0; i < period; i++) line[i] = s = smooth * s + (1 - smooth) * (line[i] - mean);
  const stop = Math.round(stopSec * RATE);
  for (let n = Math.round(atSec * RATE), i = 0; n < out.length; n++) {
    const fade = n < stop ? 1 : Math.max(0, 1 - (n - stop) / (0.01 * RATE));
    if (fade === 0) break;
    const a = line[i], b = line[(i + 1) % period];
    out[n] += gain * fade * a;
    line[i] = 0.997 * 0.5 * (a + b);
    i = (i + 1) % period;
  }
}

/** 2.5 s of audio ending 0.4 s after the moment asked about (at 2.1 s). */
const ASK_AT = 2.1;
function scene(plucks: [atSec: number, midi: number, gain: number, stopSec?: number, smooth?: number][]): Float32Array {
  const audio = new Float32Array(Math.round(2.5 * RATE));
  for (const [at, midi, gain, stop, smooth] of plucks) pluck(audio, at, midi, gain, stop, smooth);
  for (let i = 0; i < audio.length; i++) audio[i] += (rnd() * 2 - 1) * 0.0005;
  return audio;
}

let model: GraphModel;
const ask = async (audio: Float32Array, midis: number[]) =>
  onsetProbabilities(model, audio, RATE, midis.map((midi) => ({ midi, secondsBeforeEnd: 2.5 - ASK_AT })));

beforeAll(async () => {
  await tf.setBackend("wasm");
  await tf.ready();
  const dir = path.join(process.cwd(), "public/models/basic-pitch");
  const json = JSON.parse(fs.readFileSync(path.join(dir, "model.json"), "utf8"));
  const weights = fs.readFileSync(path.join(dir, "group1-shard1of1.bin"));
  model = await loadGraphModel({
    load: async () => ({
      modelTopology: json.modelTopology,
      weightSpecs: json.weightsManifest[0].weights,
      weightData: weights.buffer.slice(weights.byteOffset, weights.byteOffset + weights.byteLength),
      format: json.format, generatedBy: json.generatedBy, convertedBy: json.convertedBy,
      signature: json.signature, userDefinedMetadata: json.userDefinedMetadata,
    }),
  });
}, 60_000);

describe("the note-onset model", () => {
  it("hears B3 picked under a ringing B2 — where the pitch detector hears B2 — and not the frets beside it", async () => {
    const [b3, as3, c4] = await ask(scene([[0.8, 47, 1], [ASK_AT, 59, 0.5]]), [59, 58, 60]);
    expect(b3).toBeGreaterThanOrEqual(0.5);
    expect(as3).toBeLessThan(0.5);
    expect(c4).toBeLessThan(0.5);
  }, 30_000);

  it("hears a string picked again while it still rings", async () => {
    const [fs3] = await ask(scene([[0.6, 44, 1], [1.2, 54, 0.6, ASK_AT], [ASK_AT, 54, 0.6]]), [54]);
    expect(fs3).toBeGreaterThanOrEqual(0.5);
  }, 30_000);

  it("hears a soft, dark low E, and not the frets beside it", async () => {
    const [e2, ds2, f2] = await ask(scene([[ASK_AT, 40, 0.4, Infinity, 0.85]]), [40, 39, 41]);
    expect(e2).toBeGreaterThanOrEqual(0.5);
    expect(ds2).toBeLessThan(0.5);
    expect(f2).toBeLessThan(0.5);
  }, 30_000);

  it("doesn't take the right note still ringing for a wrong one picked beside it", async () => {
    // A#3 rings from earlier; A3 is picked where the tab wants A#3 again.
    const [as3, a3] = await ask(scene([[0.8, 47, 1], [1.2, 58, 0.6], [ASK_AT, 57, 0.6]]), [58, 57]);
    expect(as3).toBeLessThan(0.5);
    // The fret actually played is the one the model hears start (learnModelCheck asks both).
    expect(a3).toBeGreaterThan(as3);
  }, 30_000);

  it("hears nothing start when nothing was picked", async () => {
    const [as3, b2] = await ask(scene([[0.8, 47, 1], [1.2, 58, 0.6]]), [58, 47]);
    expect(as3).toBeLessThan(0.5);
    expect(b2).toBeLessThan(0.5);
  }, 30_000);
});
