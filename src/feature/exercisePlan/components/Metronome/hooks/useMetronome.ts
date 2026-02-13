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
  const nextNoteTimeRef = useRef<number>(0);
  const timerIDRef = useRef<number | null>(null);
  const countInTargetRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const beatCounterRef = useRef<number>(0);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    return () => {
      if (timerIDRef.current) {
        window.clearTimeout(timerIDRef.current);
      }
      audioContextRef.current?.close();
    };
  }, []);

  const playSound = useCallback((time: number, isAccent: boolean = false) => {
    if (!audioContextRef.current || isMutedRef.current) return;

    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = isAccent ? 1200 : 800;

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.3, time + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(time);
    oscillator.stop(time + 0.1);
  }, []);

  const scheduler = useCallback(() => {
    if (!audioContextRef.current) return;

    // While there are notes that will need to play before the next interval, 
    // schedule them and advance the pointer.
    const lookahead = 0.1; // 100ms
    const secondsPerBeat = 60.0 / bpm;
    const ctx = audioContextRef.current;

    while (nextNoteTimeRef.current < ctx.currentTime + lookahead) {
      // Determine what to play (Count-in or Beat)
      if (countInTargetRef.current > 0) {
        // Count-in logic
        // 4, 3, 2, 1
        // We update state for UI, but we must be careful with state updates in loop.
        // Actually, we can just fire the sound. State update might lag slightly but that's UI.
        // To prevent React state update throttling issues, we can check roughly where we are.
        // But for simple count-in:

        // Note: State updates in 'scheduler' (runs often) is bad.
        // But we only update when countInTargetRef changes integer value?
        // Let's just update `countInRemaining` when we schedule it.
        // Since lookahead is small, it's roughly "now".

        playSound(nextNoteTimeRef.current, countInTargetRef.current === 4); // Accent on 4 (start)? Or 1? Usually high-low-low-low

        // We need to capture the value for the closure or just use ref
        const currentCount = countInTargetRef.current;
        // Updating state in timeout to not block scheduler
        setTimeout(() => setCountInRemaining(currentCount), 0);

        countInTargetRef.current -= 1;
      } else {
        // Main Metronome
        if (startTimeRef.current === null) {
          startTimeRef.current = Date.now();
          beatCounterRef.current = 0;
          setTimeout(() => setCountInRemaining(0), 0);
        }
        playSound(nextNoteTimeRef.current, beatCounterRef.current % 4 === 0);
        beatCounterRef.current += 1;
      }

      nextNoteTimeRef.current += secondsPerBeat;
    }

    timerIDRef.current = window.setTimeout(scheduler, 25);
  }, [bpm, playSound]);

  const startMetronome = useCallback(() => {
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (timerIDRef.current) window.clearTimeout(timerIDRef.current);

    if (audioContextRef.current) {
      nextNoteTimeRef.current = audioContextRef.current.currentTime;
      countInTargetRef.current = 4;
      startTimeRef.current = null;
      beatCounterRef.current = 0;
      setCountInRemaining(4);
      scheduler();
    }

    setIsPlaying(true);
  }, [scheduler]);

  const stopMetronome = useCallback(() => {
    if (timerIDRef.current) {
      window.clearTimeout(timerIDRef.current);
      timerIDRef.current = null;
    }
    startTimeRef.current = null;
    beatCounterRef.current = 0;
    countInTargetRef.current = 0;
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
      // Just restart if BPM changes, simple
      startMetronome();
    }
  }, [bpm]); // Intentionally not including others to avoid restarts on other prop changes

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
    startMetronome,
    stopMetronome,
    handleSetRecommendedBpm,
    recommendedBpm,
    startTime: startTimeRef.current
  };
}; 
