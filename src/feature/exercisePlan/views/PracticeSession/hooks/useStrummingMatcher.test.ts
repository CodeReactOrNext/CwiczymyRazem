// @vitest-environment jsdom
//
// A strum is timed by its attack (lastAttackMsRef, already dated back by the
// analysis window) less the latency that attack still carries — not by the
// block-end stamp less the full estimate, which counted the window twice.

import { act, renderHook } from "@testing-library/react";
import type { StrumPattern } from "feature/exercisePlan/types/exercise.types";
import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useStrummingMatcher } from "./useStrummingMatcher";

// 4/4 in quarters at 60 BPM: one slot per second, every slot a down strum.
const PATTERN: StrumPattern = {
  timeSignature: [4, 4],
  subdivisions: 1,
  strums: [0, 1, 2, 3].map(() => ({ direction: "down" })) as StrumPattern["strums"],
};
const START = 1_000_000;
const WINDOW_MS = 43;
const ATTACK_LATENCY_MS = 20;

let now = START;
let frames: FrameRequestCallback[] = [];

function refs(): AudioRefs {
  const r = <T,>(current: T) => ({ current });
  return {
    frequencyRef: r(0), volumeRef: r(0), rawVolumeRef: r(0), noiseFloorRef: r(0),
    lastOnsetTimeRef: r(0), lastTickTimeRef: r(0), confidenceRef: r(0),
    noteEventsRef: r([]), lastAttackMsRef: r(0), lastLowAttackMsRef: r(0), inputTapRef: r(null),
    readSpectrum: () => null, readRecentAudio: () => null,
  } as unknown as AudioRefs;
}

/** Runs the RAF loop at `at` ms after the start. */
function frame(at: number) {
  now = START + at;
  const pending = frames;
  frames = [];
  act(() => { pending.forEach(cb => cb(now)); });
}

beforeEach(() => {
  now = START;
  frames = [];
  vi.spyOn(Date, "now").mockImplementation(() => now);
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => { frames.push(cb); return frames.length; });
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function render(audioRefs: AudioRefs, calibratedLatencyMs: number | null = null) {
  return renderHook(() => useStrummingMatcher({
    isPlaying: true, startTime: START, bpm: 60, pattern: PATTERN, isMicEnabled: true, audioRefs,
    getLatencyMs: () => ATTACK_LATENCY_MS + WINDOW_MS + 30,
    getAttackLatencyMs: () => ATTACK_LATENCY_MS + 30,
    calibratedLatencyMs, currentExerciseIndex: 0,
  }));
}

describe("useStrummingMatcher timing", () => {
  it("credits a strum on the beat, timed by its attack", () => {
    const audio = refs();
    const { result } = render(audio);
    frame(1500);
    // Struck right on slot 2 (2 s in), heard with the attack path's latency.
    audio.lastAttackMsRef!.current = START + 2000 + ATTACK_LATENCY_MS + 30;
    audio.lastOnsetTimeRef.current = START + 2000 + ATTACK_LATENCY_MS + 30 + WINDOW_MS + 25;
    frame(2100);
    frame(2200);
    expect(result.current.sessionStats.hits).toBe(1);
    expect(result.current.slotFeedback.get(2)).toBe("hit");
  });

  it("uses the calibrated latency when there is one", () => {
    const audio = refs();
    const { result } = render(audio, 80);
    frame(1500);
    audio.lastAttackMsRef!.current = START + 2000 + 80;
    frame(2100);
    frame(2200);
    expect(result.current.sessionStats.hits).toBe(1);
  });

  it("falls back to the block stamp when no attack time exists", () => {
    const audio = refs();
    const { result } = render(audio);
    frame(1500);
    audio.lastOnsetTimeRef.current = START + 2000 + ATTACK_LATENCY_MS + WINDOW_MS + 30;
    frame(2100);
    frame(2200);
    expect(result.current.sessionStats.hits).toBe(1);
  });

  it("does not credit a strum half a slot off", () => {
    const audio = refs();
    const { result } = render(audio);
    frame(1500);
    audio.lastAttackMsRef!.current = START + 2500 + ATTACK_LATENCY_MS + 30;
    frame(2600);
    frame(2700);
    expect(result.current.sessionStats.hits).toBe(0);
  });
});
