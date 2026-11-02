// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TablatureMeasure } from "../../types/exercise.types";
import { playStringNote } from "./synth.strings";
import { useTablatureAudio } from "./useTablatureAudio";

vi.mock("./synth.strings", () => ({ playStringNote: vi.fn() }));
// Never resolves: the scheduler falls back to the synth path, which is mocked above.
vi.mock("soundfont-player", () => ({ default: { instrument: () => new Promise(() => {}) } }));
vi.mock("feature/autoBacking/synth/ambientBand", () => ({
  AmbientBand: class {
    bus = {};
    setTempo() {}
    setRage() {}
    stopAll() {}
    insert(_type: unknown, gain: unknown) { return gain; }
    attachSends() { return []; }
  },
  velocityOf: () => 1,
}));

const node = () => ({ connect: vi.fn(), disconnect: vi.fn(), gain: { value: 1, setTargetAtTime: vi.fn() }, pan: { value: 0 } });

const fakeContext = () => ({
  currentTime: 0,
  state: "running",
  destination: {},
  createGain: node,
  createStereoPanner: node,
}) as unknown as AudioContext & { currentTime: number };

/** A full 4/4 bar of quarter notes — no rest for the loop to breathe on. */
const fullBar: TablatureMeasure[] = [{
  timeSignature: [4, 4],
  beats: [6, 7, 9, 10].map((fret) => ({ duration: 1, notes: [{ string: 2, fret }] })),
}];

describe("useTablatureAudio scheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(playStringNote).mockClear();
  });
  afterEach(() => vi.useRealTimers());

  const run = (singlePass: boolean) => {
    const ctx = fakeContext();
    const onLoopComplete = vi.fn();
    renderHook(() => useTablatureAudio({
      tracks: [{ id: "main", measures: fullBar, volume: 1, isMuted: false }],
      bpm: 108,
      isPlaying: true,
      startTime: 0,
      audioContext: ctx,
      audioStartTime: 0,
      singlePass,
      onLoopComplete,
    }));
    // Walk the audio clock past the end of the bar plus the stop's grace period.
    for (let t = 0; t < 4; t += 0.1) {
      ctx.currentTime = t;
      vi.advanceTimersByTime(100);
    }
    return { notes: vi.mocked(playStringNote).mock.calls.length, onLoopComplete };
  };

  it("schedules the next pass's opening notes when looping", () => {
    // 108 BPM → the bar ends at 2.22 s; by 4 s the loop has carried on.
    expect(run(false).notes).toBeGreaterThan(4);
  });

  it("plays exactly one pass with singlePass, and still reports its end", () => {
    const { notes, onLoopComplete } = run(true);
    expect(notes).toBe(4);
    expect(onLoopComplete).toHaveBeenCalledTimes(1);
  });
});
