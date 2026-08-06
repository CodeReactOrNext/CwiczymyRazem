import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface useTimerInterface {
  getTime: () => number;
  restartTime: () => void;
  /**
   * `delayMs` holds the clock frozen for that long before it starts accruing —
   * used for the metronome count-in, which must not eat practice time.
   */
  startTimer: (delayMs?: number) => void;
  stopTimer: () => void;
  timerEnabled: boolean;
  setInitialStartTime: (startTime: number) => void;
  subscribe: (cb: (time: number) => void) => () => void;
}

const useTimer = () => {
  const [timerEnabled, setTimerEnabled] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const initialTimeRef = useRef(0);
  const timerEnabledRef = useRef(false);
  const subscribersRef = useRef<Set<(time: number) => void>>(new Set());

  // Elapsed is clamped at 0 so a start anchored in the future (count-in delay)
  // reads as "not moving yet" instead of running the clock backwards.
  const getTime = useCallback(() => {
    if (startTimeRef.current !== null) {
      return initialTimeRef.current + Math.max(0, Date.now() - startTimeRef.current);
    }
    return initialTimeRef.current;
  }, []);

  const notify = useCallback(() => {
    const time = getTime();
    subscribersRef.current.forEach(cb => cb(time));
  }, [getTime]);

  const startTimer = useCallback((delayMs = 0) => {
    if (timerEnabledRef.current) return;
    timerEnabledRef.current = true;
    startTimeRef.current = Date.now() + Math.max(0, delayMs);
    setTimerEnabled(true);
    notify();
  }, [notify]);

  const stopTimer = useCallback(() => {
    if (!timerEnabledRef.current) return;
    timerEnabledRef.current = false;

    if (startTimeRef.current !== null) {
      // Stopping mid-count-in banks nothing — the delay window counts as 0.
      const sessionDuration = Math.max(0, Date.now() - startTimeRef.current);
      initialTimeRef.current += sessionDuration;
      startTimeRef.current = null;
    }

    setTimerEnabled(false);
    notify();
  }, [notify]);

  const restartTime = useCallback(() => {
    timerEnabledRef.current = false;
    initialTimeRef.current = 0;
    startTimeRef.current = null;
    setTimerEnabled(false);
    notify();
  }, [notify]);

  const setInitialStartTime = useCallback((startTime: number) => {
    initialTimeRef.current = startTime;
    startTimeRef.current = timerEnabledRef.current ? Date.now() : null;
    notify();
  }, [notify]);

  const subscribe = useCallback((cb: (time: number) => void) => {
    subscribersRef.current.add(cb);
    return () => {
      subscribersRef.current.delete(cb);
    };
  }, []);

  useEffect(() => {
    if (!timerEnabled) return;

    const interval = setInterval(() => {
      notify();
    }, 1000);

    return () => clearInterval(interval);
  }, [timerEnabled, notify]);

  return useMemo(() => ({
    getTime,
    restartTime,
    startTimer,
    stopTimer,
    timerEnabled,
    setInitialStartTime,
    subscribe,
  } as useTimerInterface), [getTime, restartTime, startTimer, stopTimer, timerEnabled, setInitialStartTime, subscribe]);
};

export default useTimer;
