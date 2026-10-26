// @vitest-environment node
//
// How far off its true pitch the shared DSP reads a note, string by string —
// through the real aubio detectors, on plucked notes whose pitch is exact by
// construction, so every cent measured is the detector's.
//
// yinfft alone reads the low strings sharp, the more so the darker the tone;
// the plain YIN (yinfast) corrects it in the low register (LOW_REFINE_* in
// guitarBufferProcessor.ts).

import { describe, expect, it, vi } from "vitest";

import type { DetectedNoteEvent } from "./guitarBufferProcessor";
import { createGuitarBufferProcessor, createGuitarDetectors } from "./guitarBufferProcessor";

const SR = 48000;
const midiHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
const cents = (freq: number, target: number) => 1200 * Math.log2(freq / target);

/** A plucked note: 12 harmonics falling off as 1/h^rolloff, the higher ones
 *  decaying faster. A larger rolloff is a darker tone — more fundamental. */
function pluck(f0: number, rolloff: number, seconds = 1.2): Float32Array {
  const out = new Float32Array(Math.round((0.3 + seconds) * SR));
  const start = Math.round(0.3 * SR);
  for (let n = start; n < out.length; n++) {
    const t = (n - start) / SR;
    let s = 0;
    for (let h = 1; h <= 12 && f0 * h < SR / 2; h++) {
      s += Math.pow(h, -rolloff) * Math.exp(-t / (1.5 / Math.pow(h, 0.7))) * Math.sin(2 * Math.PI * f0 * h * t);
    }
    out[n] = 0.25 * s * Math.min(1, (n - start) / (0.002 * SR));
  }
  return out;
}

const median = (xs: number[]) => {
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[sorted.length >> 1] ?? 0;
};

let aubio: any = null;

/** The live reading (median over the sustain) and the attack's own reading. */
async function readNote(signal: Float32Array, refine: boolean) {
  if (!aubio) {
    const loaded: any = await import("aubiojs");
    aubio = await (loaded.default || loaded)();
  }
  const detectors = createGuitarDetectors(aubio, SR);
  if (!refine) delete detectors.pitchLow;
  const targets = {
    frequencyRef: { current: 0 }, volumeRef: { current: 0 }, rawVolumeRef: { current: 0 },
    confidenceRef: { current: 0 }, lastOnsetTimeRef: { current: 0 }, lastTickTimeRef: { current: 0 },
    noiseFloorRef: { current: 0 }, noteEventsRef: { current: [] as DetectedNoteEvent[] },
  };
  let now = 1_000_000;
  const clock = vi.spyOn(Date, "now").mockImplementation(() => now);
  const process = createGuitarBufferProcessor({ detectors, targets, getGain: () => 3, sampleRate: SR });
  const readings: number[] = [];
  for (let off = 0; off + 2048 <= signal.length; off += 2048) {
    now = 1_000_000 + ((off + 2048) / SR) * 1000;
    process(signal.subarray(off, off + 2048));
    const t = (off + 2048) / SR - 0.3;
    if (t > 0.15 && t < 1.0 && targets.frequencyRef.current > 20) readings.push(targets.frequencyRef.current);
  }
  clock.mockRestore();
  for (const detector of Object.values(detectors)) (detector as { delete?: () => void })?.delete?.();
  return { live: median(readings), attack: targets.noteEventsRef.current[0]?.pitchHz ?? 0 };
}

// The low E string's first frets, the A and D strings open, and higher strings for contrast.
const NOTES: [string, number][] = [
  ["E2", 40], ["F2", 41], ["F#2", 42], ["G#2", 44], ["A2", 45], ["B2", 47], ["D3", 50], ["G3", 55], ["B3", 59], ["E4", 64],
];
const TONES: [string, number][] = [["bright", 1.2], ["dark", 2.2]];

describe("pitch read on each string", () => {
  it("reads the low strings where they are, bright or dark", async () => {
    const rows: string[] = [];
    /** Cents off in the low register, where the plain YIN corrects the reading. */
    const corrected: number[] = [];
    /** Notes above it, which must read exactly as they did before. */
    const untouched: [number, number][] = [];
    for (const [tone, rolloff] of TONES) {
      for (const [name, midi] of NOTES) {
        const f0 = midiHz(midi);
        const before = await readNote(pluck(f0, rolloff), false);
        const after = await readNote(pluck(f0, rolloff), true);
        rows.push(`${tone.padEnd(6)} ${name.padEnd(4)} yinfft ${cents(before.live, f0).toFixed(0).padStart(4)}c` +
          ` → now ${cents(after.live, f0).toFixed(0).padStart(4)}c  (attack ${cents(after.attack, f0).toFixed(0).padStart(4)}c)`);
        if (f0 < 200) corrected.push(Math.abs(cents(after.live, f0)), Math.abs(cents(after.attack, f0)));
        else untouched.push([before.live, after.live], [before.attack, after.attack]);
      }
    }
    console.log(rows.join("\n"));
    expect(Math.max(...corrected)).toBeLessThanOrEqual(3);
    for (const [before, after] of untouched) expect(after).toBe(before);
  }, 120_000);

  it("keeps a fret below out of the low E's window", async () => {
    // Eb2 played where the tab has E2: yinfft used to read it ~46 cents under
    // E2 — inside the 70-cent window the low strings get.
    const E2 = midiHz(40);
    for (const [, rolloff] of TONES) {
      const { live } = await readNote(pluck(midiHz(39), rolloff), true);
      expect(Math.abs(cents(live, E2))).toBeGreaterThan(70);
    }
  }, 60_000);
});
