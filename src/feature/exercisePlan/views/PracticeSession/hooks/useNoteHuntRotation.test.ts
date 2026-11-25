// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { HuntBarClock } from "./useNoteHuntRotation";
import { useNoteHuntRotation } from "./useNoteHuntRotation";

/** Minimal exercise: rolls A, B, C, … so a changed target is visible by name. */
const makeExercise = (noteHuntConfig: Exercise["noteHuntConfig"]): Exercise => {
  let n = 0;
  return {
    id: "test_hunt",
    title: "Test Hunt",
    description: "",
    difficulty: "easy",
    category: "theory",
    timeInMinutes: 1,
    instructions: [],
    tips: [],
    metronomeSpeed: null,
    relatedSkills: [],
    customGoal: "A",
    rollHuntTarget: () => ({ goal: String.fromCharCode(65 + n++) }),
    noteHuntConfig,
  } as Exercise;
};

const renderRotation = (exercise: Exercise, solved = false) =>
  renderHook(() => {
    const solvedRef = useRef(solved);
    return { rotation: useNoteHuntRotation(exercise, true, solvedRef), solvedRef };
  });

const renderBarLocked = (exercise: Exercise, barClock: HuntBarClock) =>
  renderHook(() => {
    const solvedRef = useRef(false);
    return { rotation: useNoteHuntRotation(exercise, true, solvedRef, false, barClock) };
  });

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useNoteHuntRotation — timer pacing", () => {
  it("counts down and rotates when the clock runs out", () => {
    const { result } = renderRotation(makeExercise({ rotateSeconds: 3, mode: "interval" }));
    const first = result.current.rotation.target!.goal;
    expect(result.current.rotation.secondsLeft).toBe(3);

    act(() => void vi.advanceTimersByTime(3000));
    expect(result.current.rotation.target!.goal).not.toBe(first);
  });

  it("moves on at once when the mic has heard the whole goal", () => {
    const { result } = renderRotation(makeExercise({ rotateSeconds: 20 }));
    const first = result.current.rotation.target!.goal;

    act(() => {
      result.current.solvedRef.current = true;
      vi.advanceTimersByTime(500);
    });
    expect(result.current.rotation.target!.goal).not.toBe(first);
    // A fresh target gets the full clock again.
    expect(result.current.rotation.secondsLeft).toBe(20);
  });

  it("does not skip the fresh target while solvedRef is still stale", () => {
    const { result } = renderRotation(makeExercise({ rotateSeconds: 20 }));

    act(() => {
      result.current.solvedRef.current = true;
      vi.advanceTimersByTime(500);
    });
    const second = result.current.rotation.target!.goal;

    act(() => void vi.advanceTimersByTime(400));
    expect(result.current.rotation.target!.goal).toBe(second);
  });

  it("leaves click-answered hunts to their own panel", () => {
    const { result } = renderRotation(makeExercise({ rotateSeconds: 20, mode: "click" }));
    const first = result.current.rotation.target!.goal;

    act(() => {
      result.current.solvedRef.current = true;
      vi.advanceTimersByTime(900);
    });
    expect(result.current.rotation.target!.goal).toBe(first);
  });
});

describe("useNoteHuntRotation — rounds that end on a verdict", () => {
  const verdictExercise = () => makeExercise({ rotateSeconds: 10, roundVerdict: true });

  it("holds a missed round until it is moved on", () => {
    const { result } = renderRotation(verdictExercise());
    const first = result.current.rotation.target!.goal;

    act(() => void vi.advanceTimersByTime(10_000));
    expect(result.current.rotation.roundEnd).toEqual({ kind: "timeUp", seconds: 10 });
    expect(result.current.rotation.secondsLeft).toBe(0);

    act(() => void vi.advanceTimersByTime(30_000));
    expect(result.current.rotation.target!.goal).toBe(first);

    act(() => result.current.rotation.advance());
    expect(result.current.rotation.roundEnd).toBeNull();
    expect(result.current.rotation.target!.goal).not.toBe(first);
    expect(result.current.rotation.secondsLeft).toBe(10);
  });

  it("answers a solved round once, and not again off the stale solved flag", () => {
    const { result } = renderRotation(verdictExercise());
    act(() => void vi.advanceTimersByTime(4000));
    act(() => {
      result.current.solvedRef.current = true;
      vi.advanceTimersByTime(200);
    });
    expect(result.current.rotation.roundEnd).toEqual({ kind: "solved", seconds: 4 });
    expect(result.current.rotation.streak).toBe(1);

    act(() => result.current.rotation.advance());
    act(() => void vi.advanceTimersByTime(300));
    expect(result.current.rotation.roundEnd).toBeNull();
    expect(result.current.rotation.streak).toBe(1);
  });

  it("ends the streak on a skipped round and on a missed one", () => {
    const { result } = renderRotation(verdictExercise());
    act(() => {
      result.current.solvedRef.current = true;
      vi.advanceTimersByTime(200);
    });
    act(() => result.current.rotation.advance());
    result.current.solvedRef.current = false;
    act(() => result.current.rotation.advance());
    expect(result.current.rotation.streak).toBe(0);
  });

  it("keeps a click-answered round's verdict in an exam", () => {
    const exercise = makeExercise({ rotateSeconds: 25, mode: "intervalClick", roundVerdict: true });
    const { result } = renderHook(() => {
      const solvedRef = useRef(false);
      return { rotation: useNoteHuntRotation(exercise, true, solvedRef, true), solvedRef };
    });
    act(() => {
      result.current.solvedRef.current = true;
      vi.advanceTimersByTime(300);
    });
    expect(result.current.rotation.roundEnd?.kind).toBe("solved");
  });

  it("just rotates in an exam", () => {
    const exercise = verdictExercise();
    const { result } = renderHook(() => {
      const solvedRef = useRef(false);
      return useNoteHuntRotation(exercise, true, solvedRef, true);
    });
    const first = result.current.target!.goal;
    act(() => void vi.advanceTimersByTime(10_000));
    expect(result.current.roundEnd).toBeNull();
    expect(result.current.target!.goal).not.toBe(first);
  });
});

describe("useNoteHuntRotation — wait-for-answer pacing", () => {
  const waitingExercise = () => makeExercise({ rotateSeconds: 0, mode: "interval", advanceOn: "solved" });

  it("shows no countdown at all", () => {
    const { result } = renderRotation(waitingExercise());
    expect(result.current.rotation.secondsLeft).toBeNull();
    // Enabled despite rotateSeconds being 0 — the flag is what turns it on.
    expect(result.current.rotation.target).not.toBeNull();
  });

  it("holds the target indefinitely while it is unsolved", () => {
    const { result } = renderRotation(waitingExercise());
    const first = result.current.rotation.target!.goal;

    act(() => void vi.advanceTimersByTime(60_000));
    expect(result.current.rotation.target!.goal).toBe(first);
  });

  it("moves on shortly after the answer lands", () => {
    const { result } = renderRotation(waitingExercise());
    const first = result.current.rotation.target!.goal;

    act(() => {
      result.current.solvedRef.current = true;
      vi.advanceTimersByTime(400); // polled, hold not elapsed yet
    });
    expect(result.current.rotation.target!.goal).toBe(first);

    act(() => void vi.advanceTimersByTime(1600));
    expect(result.current.rotation.target!.goal).not.toBe(first);
  });

  // The guard that stops a stale `solvedRef` from burning through targets: the
  // ref only clears once the provider re-renders on the new target, and without
  // the settle window the next poll would advance again immediately.
  it("does not skip the fresh target while solvedRef is still stale", () => {
    const { result } = renderRotation(waitingExercise());

    act(() => {
      result.current.solvedRef.current = true;
      vi.advanceTimersByTime(2000);
    });
    const second = result.current.rotation.target!.goal;

    // solvedRef deliberately left true, as it is for a beat after advancing.
    act(() => void vi.advanceTimersByTime(500));
    expect(result.current.rotation.target!.goal).toBe(second);
  });

  it("stays put while the session is paused", () => {
    const exercise = waitingExercise();
    const { result } = renderHook(() => {
      const solvedRef = useRef(true);
      return { rotation: useNoteHuntRotation(exercise, false, solvedRef), solvedRef };
    });
    const first = result.current.rotation.target!.goal;

    act(() => void vi.advanceTimersByTime(10_000));
    expect(result.current.rotation.target!.goal).toBe(first);
  });
});

describe("useNoteHuntRotation — bar-locked pacing", () => {
  // 2 bars of 4/4 at 120bpm = 4000ms.
  const barExercise = () =>
    makeExercise({ rotateSeconds: 6, mode: "interval", advanceOn: "bar", advanceEveryBars: 2 });
  const runningClock = (): HuntBarClock => ({ startTime: Date.now(), msPerBar: 2000 });

  it("changes on the bar line, not on the fallback stopwatch", () => {
    const { result } = renderBarLocked(barExercise(), runningClock());
    const first = result.current.rotation.target!.goal;

    // Past the 6s fallback would have fired, but short of two bars.
    act(() => void vi.advanceTimersByTime(3900));
    expect(result.current.rotation.target!.goal).toBe(first);

    act(() => void vi.advanceTimersByTime(200));
    expect(result.current.rotation.target!.goal).not.toBe(first);
  });

  it("counts down the bars that are left", () => {
    const { result } = renderBarLocked(barExercise(), runningClock());
    expect(result.current.rotation.secondsLeft).toBe(4);

    act(() => void vi.advanceTimersByTime(1500));
    expect(result.current.rotation.secondsLeft).toBe(3);
  });

  // Recomputed from the anchor rather than counted, so a stalled tab that misses
  // whole bars resumes on the right one instead of a bar behind the click.
  it("lands on the right change after the page has been asleep", () => {
    const { result } = renderBarLocked(barExercise(), runningClock());
    const first = result.current.rotation.target!.goal;

    act(() => void vi.advanceTimersByTime(20_000));
    expect(result.current.rotation.target!.goal).not.toBe(first);
    expect(result.current.rotation.secondsLeft).toBeLessThanOrEqual(4);
  });

  it("falls back to the stopwatch when the click is not running", () => {
    const { result } = renderBarLocked(barExercise(), { startTime: null, msPerBar: 2000 });
    const first = result.current.rotation.target!.goal;
    expect(result.current.rotation.secondsLeft).toBe(6);

    act(() => void vi.advanceTimersByTime(6000));
    expect(result.current.rotation.target!.goal).not.toBe(first);
  });

  it("does not change while the session is paused", () => {
    const exercise = barExercise();
    const clock = runningClock();
    const { result } = renderHook(() =>
      ({ rotation: useNoteHuntRotation(exercise, false, undefined, false, clock) }),
    );
    const first = result.current.rotation.target!.goal;

    act(() => void vi.advanceTimersByTime(10_000));
    expect(result.current.rotation.target!.goal).toBe(first);
  });
});
