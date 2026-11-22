// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import type { useTimerInterface } from "hooks/useTimer";
import { describe, expect, it } from "vitest";

import { useSessionProgress } from "./useSessionProgress";

/** A clock the test moves by hand; subscribers hear every move. */
const makeTimer = () => {
  let time = 0;
  const subscribers = new Set<(time: number) => void>();
  const timer: useTimerInterface = {
    getTime: () => time,
    restartTime: () => {
      time = 0;
    },
    startTimer: () => {},
    stopTimer: () => {},
    timerEnabled: true,
    setInitialStartTime: (t) => {
      time = t;
    },
    subscribe: (cb) => {
      subscribers.add(cb);
      return () => {
        subscribers.delete(cb);
      };
    },
  };
  const setTime = (t: number) => {
    time = t;
    subscribers.forEach((cb) => cb(t));
  };
  return { timer, setTime };
};

const render = (props: {
  isLastExercise: boolean;
  duration: number;
  freeMode?: boolean;
}) => {
  const { timer, setTime } = makeTimer();
  const hook = renderHook(
    (p: typeof props) =>
      useSessionProgress({ timer, currentExerciseIndex: 0, ...p }),
    { initialProps: props },
  );
  const tick = (ms: number) => {
    act(() => setTime(ms));
    hook.rerender(props);
  };
  return { ...hook, tick };
};

describe("useSessionProgress — one finish rule for every route", () => {
  it("treats a finish before the last exercise ran down as early, even past 20 s", () => {
    const { result, tick } = render({ isLastExercise: true, duration: 300 });
    tick(30_000);
    expect(result.current.hasLoggedPractice).toBe(true);
    expect(result.current.canFinishSession).toBe(false);
  });

  it("counts the session in full once the last exercise is played out", () => {
    const { result, tick } = render({ isLastExercise: true, duration: 300 });
    tick(300_000);
    expect(result.current.canFinishSession).toBe(true);
  });

  it("never counts a plan in full mid-way, however long the current exercise ran", () => {
    const { result, tick } = render({ isLastExercise: false, duration: 60 });
    tick(60_000);
    expect(result.current.canFinishSession).toBe(false);
    expect(result.current.isCurrentExercisePlayedOut()).toBe(true);
  });

  it("reports an exercise with time left as not played out", () => {
    const { result, tick } = render({ isLastExercise: false, duration: 60 });
    tick(25_000);
    expect(result.current.isCurrentExercisePlayedOut()).toBe(false);
  });

  it("lets an item with no clock of its own count after its 20 s", () => {
    const { result, tick } = render({ isLastExercise: true, duration: 0 });
    tick(10_000);
    expect(result.current.canFinishSession).toBe(false);
    tick(20_000);
    expect(result.current.canFinishSession).toBe(true);
    expect(result.current.isCurrentExercisePlayedOut()).toBe(true);
  });

  it("keeps free mode on the 20 s bar", () => {
    const { result, tick } = render({
      isLastExercise: true,
      duration: 300,
      freeMode: true,
    });
    tick(20_000);
    expect(result.current.canFinishSession).toBe(true);
  });
});
