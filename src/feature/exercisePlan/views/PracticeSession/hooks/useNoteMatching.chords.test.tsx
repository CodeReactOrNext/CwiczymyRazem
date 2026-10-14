// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { dMajorTriadsExercise } from "feature/exercisePlan/data/exerises/dMajorTriads/dMajorTriads";
import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { createPcmSpectrum } from "utils/audio/pcmSpectrum";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useNoteMatching } from "./useNoteMatching";

// Drives the real matcher through the first bar of "Chords — D Triads" with a
// strum played on a synthetic guitar: the mic's spectrum is computed from the
// audio, frame by frame, the way the desktop app computes it from its PCM.

const RATE = 48000;
const BPM = 120;
const BAR_MS = 4 * (60000 / BPM);
const T0 = 1_000_000;
const FRAME_MS = 10;

/** D/A — the first bar of "Chords — D Triads": A3, D4, F#4 on the G, B and e strings. */
const bar = dMajorTriadsExercise.tablature!.slice(0, 1);
const [A3, D4, FS4] = ["0-0-0", "0-0-1", "0-0-2"];
const midiHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

/** A Karplus–Strong string plucked at `startMs`, deterministic. */
const pluck = (
  out: Float32Array,
  startMs: number,
  freq: number,
  gainDb: number,
) => {
  let seed = Math.round(freq * 1000);
  const period = Math.round(RATE / freq);
  const line = new Float32Array(period);
  let smooth = 0;
  for (let i = 0; i < period; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    line[i] = smooth = 0.5 * smooth + 0.5 * ((seed / 0xffffffff) * 2 - 1);
  }
  const gain = Math.pow(10, gainDb / 20);
  for (
    let n = Math.round((startMs / 1000) * RATE), i = 0;
    n < out.length;
    n++
  ) {
    const a = line[i];
    const b = line[(i + 1) % period];
    out[n] += gain * a;
    line[i] = 0.997 * 0.5 * (a + b);
    i = (i + 1) % period;
  }
};

interface Stroke {
  midi: number;
  /** After the first string of the strum. */
  atMs: number;
  gainDb: number;
}

function strum(strokes: Stroke[]) {
  const audio = new Float32Array(Math.round((BAR_MS / 1000) * RATE));
  for (const { midi, atMs, gainDb } of strokes)
    pluck(audio, atMs, midiHz(midi), gainDb);
  const pcm = createPcmSpectrum(RATE);

  const audioRefs = {
    frequencyRef: { current: 0 },
    volumeRef: { current: 0 },
    rawVolumeRef: { current: 0 },
    lastOnsetTimeRef: { current: 0 },
    lastTickTimeRef: { current: 0 },
    confidenceRef: { current: 0 },
    readSpectrum: () => pcm.read(),
    noiseFloorRef: { current: 0 },
    noteEventsRef: { current: [] },
    lastAttackMsRef: { current: 0 },
  } as unknown as AudioRefs;

  let now = T0;
  vi.spyOn(Date, "now").mockImplementation(() => now);
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 1;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frames.set(nextFrame, cb);
    return nextFrame++;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    frames.delete(id);
  });

  const { result } = renderHook(() =>
    useNoteMatching({
      isPlaying: true,
      startTime: T0,
      effectiveBpm: BPM,
      rawBpm: BPM,
      activeTablature: bar,
      isMicEnabled: true,
      currentExerciseIndex: 0,
      speedMultiplier: 1,
      getLatencyMs: () => 0,
      audioRefs,
      getAdjustedTargetFreq: (_: number, f: number) => f,
    }),
  );

  // Struck on the downbeat and left ringing; the DSP reports the attack a
  // window after the first string.
  let fed = 0;
  while (now - T0 < BAR_MS - 100) {
    act(() => {
      now += FRAME_MS;
      const end = Math.round(((now - T0) / 1000) * RATE);
      pcm.push(audio.subarray(fed, end));
      fed = end;
      audioRefs.rawVolumeRef.current = 0.3;
      if (now - T0 === 40) {
        audioRefs.lastOnsetTimeRef.current = now;
        audioRefs.lastTickTimeRef.current = now;
        audioRefs.lastAttackMsRef!.current = T0;
      }
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((cb) => cb(now));
    });
  }
  return result;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useNoteMatching — chords", () => {
  it("hits every note of the triad and fills it for as long as it rings", () => {
    const result = strum([
      { midi: 57, atMs: 0, gainDb: 0 },
      { midi: 62, atMs: 10, gainDb: -3 },
      { midi: 66, atMs: 20, gainDb: -6 },
    ]);
    for (const key of [A3, D4, FS4]) {
      expect(result.current.hitNotes[key]).toBeTruthy();
      expect(result.current.hitNotes[key]).toBeGreaterThan(3.5); // beats into the bar
    }
  });

  it("hits the last string of a slow strum, quiet as it is", () => {
    // The top string lands 40 ms after the first, 9 dB down — the note a single
    // snapshot taken at the attack used to miss.
    const result = strum([
      { midi: 57, atMs: 0, gainDb: 0 },
      { midi: 62, atMs: 20, gainDb: -2 },
      { midi: 66, atMs: 40, gainDb: -9 },
    ]);
    for (const key of [A3, D4, FS4])
      expect(result.current.hitNotes[key]).toBeTruthy();
  });

  it("misses the note a wrong fret was played for", () => {
    // D minor: F4 where the tab has F#4.
    const result = strum([
      { midi: 57, atMs: 0, gainDb: 0 },
      { midi: 62, atMs: 10, gainDb: -3 },
      { midi: 65, atMs: 20, gainDb: -3 },
    ]);
    expect(result.current.hitNotes[A3]).toBeTruthy();
    expect(result.current.hitNotes[D4]).toBeTruthy();
    expect(result.current.hitNotes[FS4]).toBeFalsy();
  });
});
