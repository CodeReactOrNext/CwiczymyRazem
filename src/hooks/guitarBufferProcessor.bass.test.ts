// @vitest-environment node
//
// A bass's bottom octave through the real aubio detectors. The guitar path's
// 2048-sample YIN can't see a period longer than ~21 ms (47 Hz at 48 kHz), so
// E1–F#1 read as some harmonic of themselves; on bass the deep YIN takes over
// down there (BASS_* in guitarBufferProcessor.ts).

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
async function readNote(signal: Float32Array, bass: boolean) {
  if (!aubio) {
    const loaded: any = await import("aubiojs");
    aubio = await (loaded.default || loaded)();
  }
  const detectors = createGuitarDetectors(aubio, SR);
  const targets = {
    frequencyRef: { current: 0 }, volumeRef: { current: 0 }, rawVolumeRef: { current: 0 },
    confidenceRef: { current: 0 }, lastOnsetTimeRef: { current: 0 }, lastTickTimeRef: { current: 0 },
    noiseFloorRef: { current: 0 }, noteEventsRef: { current: [] as DetectedNoteEvent[] },
  };
  let now = 1_000_000;
  const clock = vi.spyOn(Date, "now").mockImplementation(() => now);
  const process = createGuitarBufferProcessor({ detectors, targets, getGain: () => 3, sampleRate: SR, isBass: () => bass });
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

// A five-string's low B, the E string's first frets, the open strings, and higher up the neck.
const NOTES: [string, number][] = [
  ["B0", 23], ["E1", 28], ["F1", 29], ["F#1", 30], ["G1", 31], ["A1", 33], ["C2", 36], ["D2", 38], ["E2", 40], ["G2", 43], ["C3", 48], ["G3", 55],
];
const TONES: [string, number][] = [["bright", 1.2], ["dark", 2.2]];

describe("pitch read on bass", () => {
  it("reads the bottom octave where it is", async () => {
    for (const [, rolloff] of TONES) {
      for (const [name, midi] of NOTES) {
        const f0 = midiHz(midi);
        const { live, attack } = await readNote(pluck(f0, rolloff), true);
        expect(Math.abs(cents(live, f0)), `${name} live`).toBeLessThanOrEqual(3);
        // Well inside the 70-cent window notes under 100 Hz are matched with.
        expect(Math.abs(cents(attack, f0)), `${name} attack`).toBeLessThanOrEqual(50);
      }
    }
  }, 120_000);

  it("can't read E1 without it — the guitar path stays as it was", async () => {
    const E1 = midiHz(28);
    const { live } = await readNote(pluck(E1, 1.2), false);
    expect(Math.abs(cents(live, E1))).toBeGreaterThan(100);
  }, 60_000);

  it("leaves notes above the bass register to the guitar path", async () => {
    for (const midi of [45, 55, 64]) {
      const signal = pluck(midiHz(midi), 1.2);
      const guitar = await readNote(signal, false);
      const bass = await readNote(signal, true);
      expect(bass.live).toBe(guitar.live);
    }
  }, 60_000);
});
