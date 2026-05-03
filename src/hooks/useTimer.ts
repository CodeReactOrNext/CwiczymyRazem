import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface useTimerInterface {
  getTime: () => number;
  restartTime: () => void;
  startTimer: () => void;
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

  const getTime = useCallback(() => {
    if (startTimeRef.current !== null) {
      return initialTimeRef.current + (Date.now() - startTimeRef.current);
    }
    return initialTimeRef.current;
  }, []);

  const notify = useCallback(() => {
    const time = getTime();
    subscribersRef.current.forEach(cb => cb(time));
  }, [getTime]);

  const startTimer = useCallback(() => {
    if (timerEnabledRef.current) return;
    timerEnabledRef.current = true;
    startTimeRef.current = Date.now();
    setTimerEnabled(true);
    notify();
  }, [notify]);

  const stopTimer = useCallback(() => {
    if (!timerEnabledRef.current) return;
    timerEnabledRef.current = false;

    if (startTimeRef.current !== null) {
      const sessionDuration = Date.now() - startTimeRef.current;
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
