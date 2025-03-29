import { useCallback, useEffect, useRef, useState } from 'react';

interface UseExerciseTimerProps {
  duration: number;
  onComplete?: () => void;
}

export const useExerciseTimer = ({ duration, onComplete }: UseExerciseTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPlaying, setIsPlaying] = useState(false);
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const remainingTimeRef = useRef(duration);
  const durationRef = useRef(duration);
  
  useEffect(() => {
    durationRef.current = duration;
    setTimeLeft(duration);
    remainingTimeRef.current = duration;
  }, [duration]);

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current === null) {
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
      return;
    }
    
    const deltaTime = time - previousTimeRef.current;
    
    // Only update if at least 1000ms (1 second) has passed
    if (deltaTime >= 1000) {
      const secondsToDecrease = Math.floor(deltaTime / 1000);
      previousTimeRef.current = time - (deltaTime % 1000); // Account for leftover time
      
      // Update remaining time
      const newRemainingTime = Math.max(0, remainingTimeRef.current - secondsToDecrease);
      remainingTimeRef.current = newRemainingTime;
      
      // Update state (throttled to reduce renders)
      setTimeLeft(newRemainingTime);
      
      // Check if timer completed
      if (newRemainingTime <= 0) {
        stopAnimation();
        setIsPlaying(false);
        onComplete?.();
        return;
      }
    }
    
    // Continue animation loop
    requestRef.current = requestAnimationFrame(animate);
  }, [onComplete]);
  
  const stopAnimation = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
      previousTimeRef.current = null;
    }
  }, []);
  
  useEffect(() => {
    if (isPlaying) {
      previousTimeRef.current = null;
      requestRef.current = requestAnimationFrame(animate);
    } else {
      stopAnimation();
    }
    
    return () => {
      stopAnimation();
    };
  }, [isPlaying, animate, stopAnimation]);

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
    stopAnimation();
    
    const newDuration = durationRef.current;
    remainingTimeRef.current = newDuration;
    setTimeLeft(newDuration);
  }, [stopAnimation]);

  // Calculate progress percentage
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