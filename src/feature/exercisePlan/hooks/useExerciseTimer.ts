import { useCallback,useEffect, useState } from 'react';

interface UseExerciseTimerProps {
  duration: number;
  onComplete?: () => void;
}

export const useExerciseTimer = ({ duration, onComplete }: UseExerciseTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsPlaying(false);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isPlaying, timeLeft, onComplete]);

  const start = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setTimeLeft(duration);
  }, [duration]);

  const progress = ((duration - timeLeft) / duration) * 100;

  return {
    timeLeft,
    progress,
    isPlaying,
    start,
    pause,
    reset
  };
}; 