import { useCallback, useEffect, useRef, useState } from 'react';

interface UseExerciseTimerProps {
  duration: number;
  onComplete?: () => void;
}

export const useExerciseTimer = ({ duration, onComplete }: UseExerciseTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const durationRef = useRef(duration);
  
  useEffect(() => {
    durationRef.current = duration;
    setTimeLeft(duration);
  }, [duration]);

  const handleTick = useCallback(() => {
    setTimeLeft(prev => {
      if (prev <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsPlaying(false);
        return 0;
      }
      
      const newTime = prev - 1;
      
      if (newTime === 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsPlaying(false);
        
        requestAnimationFrame(() => {
          onComplete?.();
        });
      }
      
      return newTime;
    });
  }, [onComplete, timeLeft]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isPlaying && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        handleTick();
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, handleTick, timeLeft]);

  const start = useCallback(() => {
    if (timeLeft > 0) {
      setIsPlaying(true);
    }
  }, [timeLeft]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    const newDuration = durationRef.current;
    setTimeLeft(newDuration);
  }, []);

  const progress = Math.max(0, Math.min(100, ((durationRef.current - timeLeft) / durationRef.current) * 100)) || 0;

  return {
    timeLeft,
    progress,
    isPlaying,
    start,
    pause,
    reset
  };
};