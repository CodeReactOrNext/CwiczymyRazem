import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { useTimerInterface } from 'hooks/useTimer';

interface TimerContextType {
  time: number;
  timeLeft: number;
  formattedTimeLeft: string;
  progress: number;
  isRunning: boolean;
  isFinished: boolean;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

interface TimerProviderProps {
  children: React.ReactNode;
  timer: useTimerInterface;
  durationInSeconds: number;
  freeMode?: boolean;
}

export const TimerProvider = ({
  children,
  timer,
  durationInSeconds,
  freeMode,
}: TimerProviderProps) => {
  const [time, setTime] = useState(() => timer.getTime());

  useEffect(() => {
    setTime(timer.getTime());
    return timer.subscribe((t) => setTime(t));
  }, [timer]);

  const safeDuration = isNaN(durationInSeconds) ? 0 : durationInSeconds;
  const safeTime = isNaN(time) ? 0 : time;

  const effectiveFreeMode = freeMode || safeDuration === 0;

  const timeLeft = effectiveFreeMode
    ? 0
    : Math.max(0, Math.floor((safeDuration * 1000 - safeTime) / 1000));

  const displaySeconds = effectiveFreeMode
    ? Math.floor(safeTime / 1000)
    : timeLeft;

  const isFinished = !effectiveFreeMode && timeLeft === 0 && safeTime > 0;

  const minutes = Math.floor(displaySeconds / 60);
  const seconds = displaySeconds % 60;

  const formattedTimeLeft = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const progress = safeDuration === 0 ? 0 : Math.min(100, (safeTime / (safeDuration * 1000)) * 100);

  const value = useMemo(() => ({
    time,
    timeLeft,
    formattedTimeLeft,
    progress,
    isRunning: timer.timerEnabled,
    isFinished,
  }), [time, timeLeft, formattedTimeLeft, progress, timer.timerEnabled, isFinished]);

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};

export const useTimerContext = () => {
  const context = useContext(TimerContext);
  if (!context) throw new Error('useTimerContext must be used within TimerProvider');
  return context;
};
