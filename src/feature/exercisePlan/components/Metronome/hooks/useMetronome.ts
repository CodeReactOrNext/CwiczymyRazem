import { useCallback, useEffect, useRef, useState } from "react";

interface UseMetronomeProps {
  initialBpm?: number;
  minBpm?: number;
  maxBpm?: number;
  recommendedBpm?: number;
}

export const useMetronome = ({
  initialBpm = 60,
  minBpm = 40,
  maxBpm = 208,
  recommendedBpm = 60,
}: UseMetronomeProps) => {
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || 
      (window as any).webkitAudioContext)();
    
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      audioContextRef.current?.close();
    };
  }, []);
  
  const playSound = useCallback(() => {
    if (!audioContextRef.current) return;
    
    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 800;
    
    gainNode.gain.value = 0;
    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.1);
  }, []);
  
  const startMetronome = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    
    const beatDuration = 60000 / bpm;
    
    playSound();
    
    intervalRef.current = window.setInterval(() => {
      playSound();
    }, beatDuration);
    
    setIsPlaying(true);
  }, [bpm, playSound]);
  
  const stopMetronome = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsPlaying(false);
  }, []);
  
  const toggleMetronome = useCallback(() => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
  }, [isPlaying, startMetronome, stopMetronome]);
  
  useEffect(() => {
    if (isPlaying) {
      startMetronome();
    }
  }, [bpm, isPlaying, startMetronome]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        toggleMetronome();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [toggleMetronome]);
  
  const handleSetRecommendedBpm = useCallback(() => {
    setBpm(recommendedBpm);
  }, [recommendedBpm]);
  
  return {
    bpm,
    isPlaying,
    minBpm,
    maxBpm,
    setBpm,
    toggleMetronome,
    handleSetRecommendedBpm,
    recommendedBpm
  };
}; 