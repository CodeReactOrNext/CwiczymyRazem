import { useEffect, useState, useCallback, useRef } from "react";

export interface useTimerInterface {
  time: number;
  restartTime: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  timerEnabled: boolean;
  setInitialStartTime: (startTime: number) => void;
}

const useTimer = () => {
  const [time, setTime] = useState(0);
  const [timerEnabled, setTimerEnabled] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const initialTimeRef = useRef(0);

  const startTimer = useCallback(() => {
    if (timerEnabled) return;
    startTimeRef.current = Date.now();
    setTimerEnabled(true);
  }, [timerEnabled]);

  const stopTimer = useCallback(() => {
    if (!timerEnabled) return;

    if (startTimeRef.current !== null) {
      const sessionDuration = Date.now() - startTimeRef.current;
      initialTimeRef.current += sessionDuration;
      startTimeRef.current = null;
    }

    setTimerEnabled(false);
    setTime(initialTimeRef.current);
  }, [timerEnabled]);

  const restartTime = useCallback(() => {
    initialTimeRef.current = 0;
    startTimeRef.current = null;
    setTime(0);
    setTimerEnabled(false);
  }, []);

  const setInitialStartTime = useCallback((startTime: number) => {
    initialTimeRef.current = startTime;
    startTimeRef.current = timerEnabled ? Date.now() : null;
    setTime(startTime);
  }, [timerEnabled]);

  useEffect(() => {
    if (!timerEnabled) return;

    const interval = setInterval(() => {
      if (startTimeRef.current !== null) {
        setTime(initialTimeRef.current + (Date.now() - startTimeRef.current));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [timerEnabled]);

  return {
    time,
    restartTime,
    startTimer,
    stopTimer,
    timerEnabled,
    setInitialStartTime,
  } as useTimerInterface;
};

export default useTimer;
