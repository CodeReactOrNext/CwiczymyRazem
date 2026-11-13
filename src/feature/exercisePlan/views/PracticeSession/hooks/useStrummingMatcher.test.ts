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
/** Strum, rest, strum, rest. */
const WITH_RESTS: StrumPattern = {
  ...PATTERN,
  strums: (["down", "miss", "down", "miss"] as const).map(direction => ({ direction })),
};
/** 16ths at 120 BPM: a slot every 125 ms, shorter than the time an attack takes to be heard. */
const SIXTEENTHS: StrumPattern = {
  timeSignature: [4, 4],
  subdivisions: 4,
  strums: Array.from({ length: 16 }, () => ({ direction: "down" })) as StrumPattern["strums"],
};
const START = 1_000_000;
const WINDOW_MS = 43;
const ATTACK_LATENCY_MS = 20;

let now = START;
let frames = new Map<number, FrameRequestCallback>();
let nextFrameId = 1;

function refs(): AudioRefs {
  const r = <T,>(current: T) => ({ current });
  return {
    frequencyRef: r(0), volumeRef: r(0), rawVolumeRef: r(0), noiseFloorRef: r(0),
    lastOnsetTimeRef: r(0), lastTickTimeRef: r(0), confidenceRef: r(0),
    noteEventsRef: r([]), lastAttackMsRef: r(0), lastLowAttackMsRef: r(0), lastSoftAttackMsRef: r(0), inputTapRef: r(null),
    readSpectrum: () => null, readRecentAudio: () => null,
  } as unknown as AudioRefs;
}

/** Runs the RAF loop at `at` ms after the start. */
function frame(at: number) {
  now = START + at;
  const pending = [...frames.values()];
  frames = new Map();
  act(() => { pending.forEach(cb => cb(now)); });
}

beforeEach(() => {
  now = START;
  frames = new Map();
  vi.spyOn(Date, "now").mockImplementation(() => now);
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => { frames.set(nextFrameId, cb); return nextFrameId++; });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => { frames.delete(id); });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function render(audioRefs: AudioRefs, calibratedLatencyMs: number | null = null, pattern = PATTERN, bpm = 60) {
  return renderHook(() => useStrummingMatcher({
    isPlaying: true, startTime: START, bpm, pattern, isMicEnabled: true, audioRefs,
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

describe("useStrummingMatcher verdicts", () => {
  it("does not call an on-time strum missed while it is still being heard", () => {
    // Slot 8 is due at 1000 ms and gone from under the cursor at 1125 ms; its
    // attack only reaches the matcher after that. It used to count as a miss
    // and then as a hit as well.
    const audio = refs();
    const { result } = render(audio, null, SIXTEENTHS, 120);
    frame(900);
    frame(1140);
    audio.lastAttackMsRef!.current = START + 1000 + ATTACK_LATENCY_MS + 30;
    frame(1160);
    frame(1300); // slot 8's deadline (1256 ms) has passed, slot 9's has not
    expect(result.current.slotFeedback.get(8)).toBe("hit");
    // Slots 0–7 went unplayed; slot 8 is not among the misses.
    expect(result.current.sessionStats).toEqual({ hits: 1, misses: 8 });
  });

  it("calls a strum missed once it can no longer arrive", () => {
    const audio = refs();
    const { result } = render(audio);
    frame(500);
    expect(result.current.sessionStats.misses).toBe(0);
    frame(1700);
    expect(result.current.sessionStats.misses).toBe(2);
    expect(result.current.slotFeedback.get(1)).toBe("miss");
  });

  it("credits a strum only the spectral-flux detector heard", () => {
    // An up stroke over a ringing chord: hfc stays quiet, specflux does not.
    const audio = refs();
    const { result } = render(audio);
    frame(1500);
    audio.lastSoftAttackMsRef!.current = START + 2000 + ATTACK_LATENCY_MS + 30;
    frame(2100);
    frame(2200);
    expect(result.current.sessionStats.hits).toBe(1);
    expect(result.current.slotFeedback.get(2)).toBe("hit");
  });

  it("lets only a clear attack call a rest wrong", () => {
    const audio = refs();
    const { result } = render(audio, null, WITH_RESTS);
    frame(500);
    // A palm mute or a chord change on the rest at slot 1 — heard by specflux only.
    audio.lastSoftAttackMsRef!.current = START + 1000 + ATTACK_LATENCY_MS + 30;
    frame(1100);
    frame(1200);
    expect(result.current.slotFeedback.get(1)).toBeUndefined();
    // A real strum on the rest at slot 3.
    audio.lastAttackMsRef!.current = START + 3000 + ATTACK_LATENCY_MS + 30;
    frame(3100);
    frame(3200);
    expect(result.current.slotFeedback.get(3)).toBe("wrong");
  });

  it("counts a strum both detectors heard once", () => {
    const audio = refs();
    const { result } = render(audio);
    frame(1500);
    audio.lastAttackMsRef!.current = START + 2000 + ATTACK_LATENCY_MS + 30;
    audio.lastSoftAttackMsRef!.current = START + 2000 + ATTACK_LATENCY_MS + 10;
    frame(2100);
    audio.lastAttackMsRef!.current = START + 2000 + ATTACK_LATENCY_MS + 60; // a second report of the same strum
    frame(2200);
    frame(2300);
    expect(result.current.sessionStats.hits).toBe(1);
  });
});

describe("useStrummingMatcher over a restart", () => {
  /** The hook on a clock the test can move: a restart or a tempo change gives a new one. */
  function renderOn(audioRefs: AudioRefs, startTime: number, bpm = 60) {
    return renderHook(
      (props: { startTime: number; bpm: number }) => useStrummingMatcher({
        isPlaying: true, startTime: props.startTime, bpm: props.bpm, pattern: PATTERN, isMicEnabled: true, audioRefs,
        getLatencyMs: () => ATTACK_LATENCY_MS + WINDOW_MS + 30,
        getAttackLatencyMs: () => ATTACK_LATENCY_MS + 30,
        calibratedLatencyMs: null, currentExerciseIndex: 0,
      }),
      { initialProps: { startTime, bpm } },
    );
  }
  const heardAt = (ms: number) => ms + ATTACK_LATENCY_MS + 30;

  it("credits the same slots again after the pattern is started over", () => {
    const audio = refs();
    const { result, rerender } = renderOn(audio, START);
    frame(1500);
    audio.lastAttackMsRef!.current = heardAt(START + 2000);
    frame(2100);
    frame(2200);
    expect(result.current.sessionStats.hits).toBe(1);

    // Started over 10 s in: the slots count from 0 again.
    const restart = START + 10_000;
    rerender({ startTime: restart, bpm: 60 });
    frame(10_500);
    audio.lastAttackMsRef!.current = heardAt(restart + 1000);
    frame(11_100);
    audio.lastAttackMsRef!.current = heardAt(restart + 2000);
    frame(12_100);
    frame(12_200);
    expect(result.current.sessionStats.hits).toBe(3);
  });

  it("keeps crediting strums after the tempo is turned down", () => {
    const audio = refs();
    const { result, rerender } = renderOn(audio, START, 120);
    // Eight slots played through at 120 BPM (one every 500 ms).
    for (let slot = 1; slot <= 8; slot++) {
      audio.lastAttackMsRef!.current = heardAt(START + slot * 500);
      frame(slot * 500 + 100);
    }
    frame(4300);
    expect(result.current.sessionStats.hits).toBe(8);
    const missesBefore = result.current.sessionStats.misses;

    // Down to 60 BPM on the same clock: 5 s in is now slot 5, a number already used.
    rerender({ startTime: START, bpm: 60 });
    frame(4400);
    audio.lastAttackMsRef!.current = heardAt(START + 5000);
    frame(5100);
    frame(5200);
    expect(result.current.sessionStats.hits).toBe(9);
    // What went by before the change is not called missed after it.
    expect(result.current.sessionStats.misses).toBe(missesBefore);
  });
});
