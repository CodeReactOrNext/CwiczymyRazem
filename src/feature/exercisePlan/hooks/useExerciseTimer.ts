import { useCallback, useEffect, useRef, useState } from 'react';

interface UseExerciseTimerProps {
  duration: number;
  onComplete?: () => void;
}

export const useExerciseTimer = ({ duration, onComplete }: UseExerciseTimerProps) => {
  console.log('useExerciseTimer hook initialized/re-rendered with duration:', duration);
  
  // States and refs - all called unconditionally at the top of component
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const durationRef = useRef(duration);
  
  // Update duration reference when it changes
  useEffect(() => {
    console.log(`🔄 Duration changed to ${duration}, updating reference`);
    durationRef.current = duration;
    setTimeLeft(duration); // Reset timeLeft when duration changes
    console.log(`⏱️ timeLeft state reset to ${duration}`);
  }, [duration]);

  // Handle timer ticks
  const handleTick = useCallback(() => {
    console.log(`⌛ Interval tick - current timeLeft: ${timeLeft}`);
    
    setTimeLeft(prev => {
      if (prev <= 0) {
        console.log('🛑 Timer already at zero, stopping interval');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsPlaying(false);
        return 0;
      }
      
      const newTime = prev - 1;
      console.log(`🔄 Updating timer: ${prev}s → ${newTime}s`);
      
      // Check if we reached zero
      if (newTime === 0) {
        console.log('🏁 Timer reached zero, will call onComplete');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsPlaying(false);
        
        // Call onComplete on next tick to ensure state updates first
        requestAnimationFrame(() => {
          console.log('✅ Executing onComplete callback');
          onComplete?.();
        });
      }
      
      return newTime;
    });
  }, [onComplete, timeLeft]);

  // Main effect managing the interval - only runs when isPlaying changes
  useEffect(() => {
    console.log(`📌 Play state changed - isPlaying: ${isPlaying}`);
    
    // Clean up any existing interval
    if (intervalRef.current) {
      console.log('🧹 Cleaning up existing interval');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Start new interval only if playing and time > 0
    if (isPlaying && timeLeft > 0) {
      console.log('▶️ Starting timer interval');
      console.log(`⏱️ Initial timeLeft: ${timeLeft}`);
      intervalRef.current = setInterval(() => {
        console.log('⏱️ Interval callback executing');
        handleTick();
      }, 1000);
      console.log('⏱️ Interval set with 1000ms delay');
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        console.log('♻️ Cleanup: clearing interval in effect cleanup');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, handleTick, timeLeft]);

  // Action functions
  const start = useCallback(() => {
    console.log('▶️ start() called - checking if can start');
    if (timeLeft > 0) {
      console.log('✅ Setting isPlaying to true');
      setIsPlaying(true);
    } else {
      console.log('⚠️ Cannot start timer with 0 time left');
    }
  }, [timeLeft]);

  const pause = useCallback(() => {
    console.log('⏸️ pause() called - setting isPlaying to false');
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    console.log('🔄 reset() called - resetting timer');
    setIsPlaying(false);
    
    if (intervalRef.current) {
      console.log('🧹 reset(): cleaning up interval');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Use current value from reference
    const newDuration = durationRef.current;
    setTimeLeft(newDuration);
    console.log(`⏱️ Timer reset to ${newDuration} seconds`);
  }, []);

  // Calculate progress
  const progress = Math.max(0, Math.min(100, ((durationRef.current - timeLeft) / durationRef.current) * 100)) || 0;

  // Log time changes for debugging
  useEffect(() => {
    console.log(`⏱️ Timer state updated: ${timeLeft} seconds left (${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")})`);
    console.log(`📈 Progress: ${progress.toFixed(2)}%`);
  }, [timeLeft, progress]);

  return {
    timeLeft,
    progress,
    isPlaying,
    start,
    pause,
    reset
  };
}; 