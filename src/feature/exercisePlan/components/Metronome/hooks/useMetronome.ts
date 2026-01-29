import { useCallback, useEffect, useRef, useState } from "react";

interface UseMetronomeProps {
  initialBpm?: number;
  minBpm?: number;
  maxBpm?: number;
  recommendedBpm?: number;
  isMuted?: boolean;
}

export const useMetronome = ({
  initialBpm = 60,
  minBpm = 40,
  maxBpm = 208,
  recommendedBpm = 60,
  isMuted = false,
}: UseMetronomeProps) => {
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countInRemaining, setCountInRemaining] = useState<number>(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

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

  const playSound = useCallback((isAccent: boolean = false) => {
    if (!audioContextRef.current || isMuted) return;

    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = isAccent ? 1200 : 800;

    gainNode.gain.value = 0;
    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.1);
  }, [isMuted]);

  const startMetronome = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }

    const beatDuration = 60000 / bpm;

    // Start with 4 counts
    let currentCount = 4;
    setCountInRemaining(currentCount);
    startTimeRef.current = null; // Clear start time at beginning of count-in

    playSound(true);

    intervalRef.current = window.setInterval(() => {
      if (currentCount > 1) {
        currentCount -= 1;
        setCountInRemaining(currentCount);
        playSound(false);
      } else if (currentCount === 1) {
        currentCount = 0;
        setCountInRemaining(0);
        startTimeRef.current = Date.now();
        playSound(true);
      } else {
        playSound(false);
      }
    }, beatDuration);

    setIsPlaying(true);
  }, [bpm, playSound]);

  const stopMetronome = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    startTimeRef.current = null;
    setCountInRemaining(0);
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
    if (isPlaying && countInRemaining === 0 && startTimeRef.current) {
      // Handle BPM changes while playing by restarting BUT without count-in if already started?
      // Actually, easiest is just to restart everything if BPM changes.
      // But user might not want count-in on BPM change during play.
      // For now, let's keep it simple: restart if BPM changes.
      startMetronome();
    }
  }, [bpm]);

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
    countInRemaining,
    minBpm,
    maxBpm,
    setBpm,
    toggleMetronome,
    handleSetRecommendedBpm,
    recommendedBpm,
    startTime: startTimeRef.current
  };
}; 
