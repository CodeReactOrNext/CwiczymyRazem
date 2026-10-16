// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TablatureMeasure } from "../../../types/exercise.types";
import { buildLearnSteps } from "../utils/learnSteps";
import { useLearnModeMatcher } from "./useLearnModeMatcher";

// A two-note exercise on a rest-free bar: A2 on the low E string's 5th fret,
// then E3 on the A string's 7th. The mic is a pair of refs we write by hand.

const A2 = 110;
const E3 = 164.81;
const FRAME_MS = 16;

const measures: TablatureMeasure[] = [
  {
    timeSignature: [4, 4],
    beats: [
      { duration: 1, notes: [{ string: 6, fret: 5 }] },
      { duration: 1, notes: [{ string: 5, fret: 7 }] },
    ],
  },
];
const steps = buildLearnSteps(measures);

function setup() {
  const audioRefs = {
    frequencyRef: { current: 0 },
    volumeRef: { current: 0 },
    rawVolumeRef: { current: 0 },
    lastOnsetTimeRef: { current: 0 },
    lastTickTimeRef: { current: 0 },
    confidenceRef: { current: 0 },
    noiseFloorRef: { current: 0 },
    noteEventsRef: { current: [] },
  } as unknown as AudioRefs;

  let now = 1_000_000;
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

  const hook = renderHook(
    (props: { active: boolean; resetKey: number }) =>
      useLearnModeMatcher({
        steps, audioRefs, getAdjustedTargetFreq: (_string, freq) => freq, ...props,
      }),
    { initialProps: { active: true, resetKey: 0 } },
  );

  const frame = () =>
    act(() => {
      now += FRAME_MS;
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((cb) => cb(now));
    });
  const run = (ms: number) => {
    for (let t = 0; t < ms; t += FRAME_MS) frame();
  };
  /** Plucks a string: the attack, then the pitch ringing for a moment, then quiet. */
  const play = (freq: number) => {
    audioRefs.lastOnsetTimeRef.current = now;
    audioRefs.frequencyRef.current = freq;
    audioRefs.rawVolumeRef.current = 0.2;
    run(150);
    audioRefs.frequencyRef.current = 0;
    audioRefs.rawVolumeRef.current = 0;
    run(50);
  };

  run(FRAME_MS * 2); // the first frame arms the judge
  return { hook, play, run };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useLearnModeMatcher", () => {
  it("waits on the first note, however long nothing is played", () => {
    const { hook, run } = setup();
    run(3000);
    expect(hook.result.current).toMatchObject({ stepIndex: 0, totalSteps: 2, passes: 0, hitNotes: {} });
  });

  it("moves on only when the note is played, and fills the notes behind it", () => {
    const { hook, play } = setup();
    play(A2);
    expect(hook.result.current.stepIndex).toBe(1);
    expect(hook.result.current.hitNotes).toEqual({ "0-0-0": 1 });
    expect(hook.result.current.cursorBeat).toBe(1);
  });

  it("stays put on a wrong note", () => {
    const { hook, play } = setup();
    play(E3);
    expect(hook.result.current.stepIndex).toBe(0);
  });

  it("starts another pass after the last note", () => {
    const { hook, play } = setup();
    play(A2);
    play(E3);
    expect(hook.result.current).toMatchObject({ stepIndex: 0, passes: 1, hitNotes: {}, cursorBeat: 0 });
  });

  it("does not listen while it is not active", () => {
    const { hook, play } = setup();
    hook.rerender({ active: false, resetKey: 0 });
    play(A2);
    expect(hook.result.current.stepIndex).toBe(0);
  });

  it("lets a note be skipped, and the pass be started over", () => {
    const { hook } = setup();
    act(() => hook.result.current.skip());
    expect(hook.result.current.stepIndex).toBe(1);
    act(() => hook.result.current.restart());
    expect(hook.result.current).toMatchObject({ stepIndex: 0, passes: 0 });
  });

  it("starts over when the session restarts the exercise", () => {
    const { hook, play } = setup();
    play(A2);
    hook.rerender({ active: true, resetKey: 1 });
    expect(hook.result.current).toMatchObject({ stepIndex: 0, passes: 0 });
  });
});
