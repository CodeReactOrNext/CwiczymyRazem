import type { useTimerInterface } from "hooks/useTimer";
import { useEffect, useState } from "react";

/**
 * Whether the exercise on screen has run its clock down. False for anything
 * without a clock. Read off the timer itself rather than TimerContext, because
 * the session needs it above the provider.
 */
export function useExerciseTimeUp(timer: useTimerInterface, durationSeconds: number, freeMode: boolean): boolean {
  const hasClock = !freeMode && durationSeconds > 0;
  const [timeUp, setTimeUp] = useState(false);

  useEffect(() => {
    if (!hasClock) return undefined;
    const read = (time: number) => setTimeUp(Math.floor((durationSeconds * 1000 - time) / 1000) <= 0);
    read(timer.getTime());
    return timer.subscribe(read);
  }, [timer, durationSeconds, hasClock]);

  return hasClock && timeUp;
}
