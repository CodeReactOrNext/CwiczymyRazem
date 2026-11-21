// @vitest-environment node
//
// A bass line crossing strings while the strings it left keep ringing — the
// way a bass is mostly played, since a plucked bass string sustains for
// seconds. Under the note just played there is then still a lower (going up)
// or higher (going down) one, and a pitch detector reads the mixture: the
// longer its window, the more of the ringing string it hears. Going up is the
// harder way, as each new string is thinner and quieter than the one ringing
// under it — and that is where players reported notes going unheard.

import type { ExpectedAttack } from "feature/exercisePlan/views/PracticeSession/hooks/noteEventGrader";
import { assignAttacks } from "feature/exercisePlan/views/PracticeSession/hooks/noteEventGrader";
import { getBaseToleranceCents } from "utils/audio/noteUtils";
import { describe, expect, it, vi } from "vitest";

import type { DetectedNoteEvent } from "./guitarBufferProcessor";
import { createGuitarBufferProcessor, createGuitarDetectors } from "./guitarBufferProcessor";

const SR = 48000;
const LEAD_SEC = 0.3;
const midiHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
/** Bass open strings, string 1 (G) to 4 (E). */
const OPEN = [0, 43, 38, 33, 28];
/** Thinner strings are quieter. */
const LEVEL = [0, 0.35, 0.5, 0.75, 1];

type Position = [string: number, fret: number];

/** Each string rings until it is played again; `rolloff` darkens the tone. */
function render(line: Position[], beatSec: number, rolloff: number): Float32Array {
  const out = new Float32Array(Math.round((LEAD_SEC + line.length * beatSec + 0.5) * SR));
  line.forEach(([string, fret], i) => {
    const f0 = midiHz(OPEN[string] + fret);
    const start = Math.round((LEAD_SEC + i * beatSec) * SR);
    let next = line.findIndex(([s], j) => j > i && s === string);
    if (next < 0) next = line.length;
    const end = Math.round((LEAD_SEC + next * beatSec) * SR);
    for (let n = start; n < Math.min(end + Math.round(0.02 * SR), out.length); n++) {
      const t = (n - start) / SR;
      let s = 0;
      for (let h = 1; h <= 12 && f0 * h < SR / 2; h++) {
        s += Math.pow(h, -rolloff) * Math.exp(-t / (1.5 / Math.pow(h, 0.7))) * Math.sin(2 * Math.PI * f0 * h * t);
      }
      const fadeIn = Math.min(1, (n - start) / (0.002 * SR));
      const fadeOut = n > end ? Math.max(0, 1 - (n - end) / (0.02 * SR)) : 1;
      out[n] += 0.2 * LEVEL[string] * s * fadeIn * fadeOut;
    }
  });
  return out;
}

let aubio: any = null;

/** How many of the line's notes the session would credit (assignAttacks, as useNoteMatching calls it). */
async function credited(line: Position[], beatSec: number, rolloff: number): Promise<number> {
  if (!aubio) {
    const loaded: any = await import("aubiojs");
    aubio = await (loaded.default || loaded)();
  }
  const signal = render(line, beatSec, rolloff);
  const detectors = createGuitarDetectors(aubio, SR);
  const targets = {
    frequencyRef: { current: 0 }, volumeRef: { current: 0 }, rawVolumeRef: { current: 0 },
    confidenceRef: { current: 0 }, lastOnsetTimeRef: { current: 0 }, lastTickTimeRef: { current: 0 },
    noiseFloorRef: { current: 0 }, noteEventsRef: { current: [] as DetectedNoteEvent[] },
  };
  const T0 = 1_000_000;
  let now = T0;
  const clock = vi.spyOn(Date, "now").mockImplementation(() => now);
  const process = createGuitarBufferProcessor({ detectors, targets, getGain: () => 3, sampleRate: SR, isBass: () => true });
  const events: DetectedNoteEvent[] = [];
  for (let off = 0; off + 2048 <= signal.length; off += 2048) {
    now = T0 + ((off + 2048) / SR) * 1000;
    process(signal.subarray(off, off + 2048));
    for (const event of targets.noteEventsRef.current) if (!events.includes(event)) events.push(event);
  }
  // The attack spectra settle ~170 ms after each attack — let the last one in.
  for (let i = 0; i < 12; i++) {
    now += (2048 / SR) * 1000;
    process(new Float32Array(2048));
    for (const event of targets.noteEventsRef.current) if (!events.includes(event)) events.push(event);
  }
  clock.mockRestore();
  for (const detector of Object.values(detectors)) (detector as { delete?: () => void })?.delete?.();

  const expected: ExpectedAttack[] = line.map(([string, fret], i) => {
    const targetFreq = midiHz(OPEN[string] + fret);
    return {
      key: String(i),
      timeMs: T0 + (LEAD_SEC + i * beatSec) * 1000,
      targetFreq,
      toleranceCents: getBaseToleranceCents(targetFreq),
      volumeGate: 0,
      readsAttack: true,
    };
  });
  return assignAttacks(events, expected, 120).length;
}

// G major up the neck in one position — the bass_major_scale_one_octave line, and on to the G string.
const UP: Position[] = [[4, 3], [4, 5], [3, 2], [3, 3], [3, 5], [2, 2], [2, 4], [2, 5], [1, 2], [1, 4]];
const DOWN: Position[] = [...UP].reverse();

describe("bass lines under strings still ringing", () => {
  // The pitch read after such an attack is pulled toward the ringing string —
  // more than a semitone on a dark tone going up (measured 2026-11-21) — so
  // it's the attack's own spectrum (attackTones.ts) that credits most of
  // these. This holds that line, both ways and both tones.
  it.each([
    { label: "up", line: UP, rolloff: 1.2 }, { label: "up", line: UP, rolloff: 2.2 },
    { label: "down", line: DOWN, rolloff: 1.2 }, { label: "down", line: DOWN, rolloff: 2.2 },
  ])("credits a line going $label (rolloff $rolloff)", async ({ line, rolloff }) => {
    expect(await credited(line, 0.857, rolloff)).toBeGreaterThanOrEqual(line.length - 1);
    expect(await credited(line, 0.4, rolloff)).toBeGreaterThanOrEqual(line.length - 2);
  }, 120_000);
});
