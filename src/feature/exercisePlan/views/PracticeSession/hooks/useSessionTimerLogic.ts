import { useMemo } from 'react';

interface UseSessionTimerLogicProps {
  timerTime: number;
  exerciseDurationInMinutes: number;
  freeMode?: boolean;
  videoDuration: number | null;
}

export const useSessionTimerLogic = ({
  timerTime,
  exerciseDurationInMinutes,
  freeMode,
  videoDuration,
}: UseSessionTimerLogicProps) => {
  const effectiveTotalSeconds = freeMode
    ? Number.MAX_SAFE_INTEGER
    : videoDuration !== null
      ? videoDuration
      : exerciseDurationInMinutes * 60;

  const timeLeft = Math.max(0, Math.floor((effectiveTotalSeconds * 1000 - timerTime) / 1000));
  const elapsedSeconds = Math.floor(timerTime / 1000);

  const formattedTimeLeft = useMemo(() => {
    if (freeMode) {
      return `${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, '0')}`;
    }
    return `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`;
  }, [freeMode, elapsedSeconds, timeLeft]);

  const timerProgressValue = freeMode ? 0 : Math.min(100, (timerTime / (effectiveTotalSeconds * 1000)) * 100);

  return {
    timeLeft,
    formattedTimeLeft,
    timerProgressValue,
  };
};
