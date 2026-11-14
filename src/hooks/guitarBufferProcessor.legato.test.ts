// @vitest-environment node
//
// How late the detector reports a hammer-on / pull-off.
//
// A legato note has no attack; the matcher times it by the moment its pitch
// comes up and holds (legatoHold.ts). This renders a picked note that changes
// pitch under the ringing string — no pick noise, no new attack — pushes it
// through the SHARED guitar DSP and measures how long after the change the
// held reading starts, against what the matcher's clock already takes off.

import { createLegatoHold } from "feature/exercisePlan/views/PracticeSession/utils/legatoHold";
import { getCentsDistance } from "utils/audio/noteUtils";
import { describe, expect, it, vi } from "vitest";

import { createGuitarBufferProcessor, createGuitarDetectors } from "./guitarBufferProcessor";

const SR = 48000;
const WINDOW = 2048;
const CENTS_TOLERANCE = 45; // same as useNoteMatching
/** What the web path's getLatencyMs() takes off besides real I/O latency: the window and a flat 30 ms. */
const CLOCK_LATENCY_MS = (WINDOW / SR) * 1000 + 30;

/** A picked note at `from` that becomes `to` at `changeSample`, phase-continuous. */
function renderSlur(from: number, to: number, startSample: number, changeSample: number, totalSamples: number): Float32Array {
  const out = new Float32Array(totalSamples);
  let seed = 4242;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000 * 2 - 1;
  };
  const phases = new Float64Array(13);
  const pickSamples = Math.round(0.003 * SR);
  const attackSamples = Math.round(0.002 * SR);
  for (let n = startSample; n < totalSamples; n++) {
    const f0 = n < changeSample ? from : to;
    // The string keeps ringing through the change: one decay from the pick on.
    const t = (n - startSample) / SR;
    let s = 0;
    for (let h = 1; h <= 12; h++) {
      const f = f0 * h;
      if (f > SR / 2) break;
      phases[h] += (2 * Math.PI * f) / SR;
      s += Math.pow(h, -1.2) * Math.exp(-t / (1.2 / Math.pow(h, 0.7))) * Math.sin(phases[h]);
    }
    if (n - startSample < pickSamples) s += rand() * 0.6;
    out[n] = s * Math.min(1, (n - startSample) / attackSamples);
  }
  let max = 0;
  for (let i = 0; i < totalSamples; i++) max = Math.max(max, Math.abs(out[i]));
  for (let i = 0; i < totalSamples; i++) out[i] = out[i] * (0.25 / max) + rand() * 0.001;
  return out;
}

async function heldSinceMs(signal: Float32Array, target: number): Promise<number | null> {
  const AubioModule: any = await import("aubiojs");
  const aubio = await (AubioModule.default || AubioModule)();
  const targets = {
    frequencyRef: { current: 0 }, volumeRef: { current: 0 }, rawVolumeRef: { current: 0 },
    confidenceRef: { current: 0 }, lastOnsetTimeRef: { current: 0 }, lastTickTimeRef: { current: 0 },
    noiseFloorRef: { current: 0 }, noteEventsRef: { current: [] },
  } as any;
  let virtualMs = 0;
  const nowSpy = vi.spyOn(Date, "now").mockImplementation(() => 1_000_000 + virtualMs);
  const process = createGuitarBufferProcessor({ detectors: createGuitarDetectors(aubio, SR), targets, getGain: () => 3.0, sampleRate: SR });
  const hold = createLegatoHold();
  let since: number | null = null;
  for (let off = 0; off + WINDOW <= signal.length && since === null; off += WINDOW) {
    virtualMs = ((off + WINDOW) / SR) * 1000;
    process(signal.subarray(off, off + WINDOW));
    const freq = targets.frequencyRef.current;
    since = hold.observe("n", virtualMs, freq > 20 && Math.abs(getCentsDistance(freq, target)) <= CENTS_TOLERANCE);
  }
  nowSpy.mockRestore();
  return since;
}

const SLURS: { label: string; from: number; to: number }[] = [
  { label: "pull-off G 7>5", from: 293.66, to: 261.63 },
  { label: "pull-off D 7>5", from: 220.0, to: 196.0 },
  { label: "pull-off A 7>5", from: 164.81, to: 146.83 },
  { label: "pull-off e 8>5", from: 523.25, to: 440.0 },
  { label: "hammer-on G 5>7", from: 261.63, to: 293.66 },
  { label: "hammer-on A 5>7", from: 146.83, to: 164.81 },
  { label: "hammer-on E 3>5", from: 98.0, to: 110.0 },
];

describe("legato pitch-change lag", () => {
  it("reports a slur within the lag the matcher takes off", async () => {
    const biases: number[] = [];
    for (const slur of SLURS) {
      const row: number[] = [];
      // The change lands at different places in the 2048-sample block.
      for (let phase = 0; phase < 8; phase++) {
        const start = Math.round(0.2 * SR);
        const change = start + Math.round(0.6 * SR) + phase * (WINDOW / 8);
        const signal = renderSlur(slur.from, slur.to, start, change, change + Math.round(0.6 * SR));
        const since = await heldSinceMs(signal, slur.to);
        expect(since, `${slur.label} never held`).not.toBeNull();
        row.push(since! - (change / SR) * 1000 - CLOCK_LATENCY_MS);
      }
      biases.push(...row);
      console.log(`${slur.label.padEnd(18)} bias ms: ${row.map((b) => Math.round(b)).join(" ")}`);
    }
    const sorted = [...biases].sort((a, b) => a - b);
    const median = sorted[sorted.length >> 1];
    console.log(`median bias ${Math.round(median)} ms, range ${Math.round(sorted[0])}..${Math.round(sorted[sorted.length - 1])} ms`);
    // Measured: median 2 ms, -25..23 ms — the matcher uses the moment as it
    // is. Well inside "on time" (±130 ms at the least); a detector change that
    // moves it has to bring a correction along.
    expect(Math.abs(median)).toBeLessThanOrEqual(15);
    expect(sorted[sorted.length - 1]).toBeLessThan(50);
    expect(sorted[0]).toBeGreaterThan(-50);
  }, 120_000);
});
