import { useCallback, useEffect, useRef, useState } from 'react';

interface UseExerciseTimerProps {
  duration: number;
  onComplete?: () => void;
}

export const useExerciseTimer = ({ duration, onComplete }: UseExerciseTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Use refs to track the actual time
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeLeftRef = useRef<number>(duration);
  const durationRef = useRef(duration);
  
  useEffect(() => {
    durationRef.current = duration;
    setTimeLeft(duration);
    pausedTimeLeftRef.current = duration;
  }, [duration]);

  // Clear any existing interval
  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Update timer based on elapsed time since start
  const updateTimer = useCallback(() => {
    if (startTimeRef.current === null) return;
    
    const elapsedMs = Date.now() - startTimeRef.current;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    const newTimeLeft = Math.max(0, pausedTimeLeftRef.current - elapsedSeconds);
    
    // Only update state if the time has actually changed
    if (newTimeLeft !== timeLeft) {
      setTimeLeft(newTimeLeft);
      
      // Check if timer completed
      if (newTimeLeft <= 0) {
        clearTimerInterval();
        setIsPlaying(false);
        startTimeRef.current = null;
        onComplete?.();
      }
    }
  }, [timeLeft, clearTimerInterval, onComplete]);

  // Start the timer
  const start = useCallback(() => {
    if (timeLeft <= 0) return;
    
    clearTimerInterval();
    setIsPlaying(true);
    
    // Record exact start time
    startTimeRef.current = Date.now() - ((pausedTimeLeftRef.current - timeLeft) * 1000);
    
    // Use both setInterval (for reliable background updates) and requestAnimationFrame (for smooth UI)
    intervalRef.current = setInterval(() => {
      updateTimer();
    }, 250); // Update 4 times per second to ensure we don't miss seconds
  }, [timeLeft, clearTimerInterval, updateTimer]);

  // Pause the timer
  const pause = useCallback(() => {
    if (!isPlaying) return;
    
    clearTimerInterval();
    setIsPlaying(false);
    
    // Store the exact time left when paused
    if (startTimeRef.current !== null) {
      const elapsedMs = Date.now() - startTimeRef.current;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      pausedTimeLeftRef.current = Math.max(0, pausedTimeLeftRef.current - elapsedSeconds);
    }
    
    startTimeRef.current = null;
  }, [isPlaying, clearTimerInterval]);

  // Reset the timer
  const reset = useCallback(() => {
    clearTimerInterval();
    setIsPlaying(false);
    startTimeRef.current = null;
    
    const newDuration = durationRef.current;
    pausedTimeLeftRef.current = newDuration;
    setTimeLeft(newDuration);
  }, [clearTimerInterval]);

  // Ensure clean up on component unmount
  useEffect(() => {
    return () => {
      clearTimerInterval();
    };
  }, [clearTimerInterval]);

  // Handle play/pause changes
  useEffect(() => {
    if (isPlaying) {
      // Only start if not already running
      if (startTimeRef.current === null) {
        start();
      }
    } else {
      // Make sure timer is paused
      if (startTimeRef.current !== null) {
        pause();
      }
    }
  }, [isPlaying, start, pause]);

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