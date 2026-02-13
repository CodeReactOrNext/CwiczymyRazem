import { useCallback, useEffect, useRef, useState } from "react";

import { isIOSDevice } from "../utils/deviceDetection";

interface UseMobileMetronomeProps {
  initialBpm?: number;
  minBpm?: number;
  maxBpm?: number;
  recommendedBpm?: number;
  isMuted?: boolean;
}

export const useMobileMetronome = ({
  initialBpm = 60,
  minBpm = 40,
  maxBpm = 208,
  recommendedBpm = 60,
  isMuted = false,
}: UseMobileMetronomeProps) => {
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countInRemaining, setCountInRemaining] = useState<number>(0);
  const [audioInitialized, setAudioInitialized] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const audioStartTimeRef = useRef<number | null>(null);
  const countInTargetRef = useRef<number>(0);
  const beatCounterRef = useRef<number>(0);
  const isIOS = isIOSDevice();
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isMutedRef.current = isMuted;

    // Also update global gain node if it exists (for extra safety)
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(isMuted ? 0 : 1, audioContextRef.current.currentTime, 0.01);
    }
  }, [isMuted]);

  // Initialize audio (must be called on user gesture)
  const initializeAudio = useCallback(() => {
    if (audioInitialized) return true;

    try {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      // Create persistent nodes for better performance on mobile
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = isMutedRef.current ? 0 : 1;
      gainNodeRef.current.connect(audioContextRef.current.destination);

      // For iOS, we need to play a silent sound to unlock the audio
      if (isIOS) {
        const silentOscillator = audioContextRef.current.createOscillator();
        silentOscillator.frequency.value = 1;
        const silentGain = audioContextRef.current.createGain();
        silentGain.gain.value = 0.001;
        silentOscillator.connect(silentGain);
        silentGain.connect(audioContextRef.current.destination);
        silentOscillator.start(0);
        silentOscillator.stop(audioContextRef.current.currentTime + 0.001);
      }

      setAudioInitialized(true);
      return true;
    } catch (error) {
      console.error("Failed to initialize audio:", error);
      return false;
    }
  }, [audioInitialized, isIOS]);

  // Schedule next note with precise timing
  const scheduleNote = useCallback((time: number, isAccent: boolean = false) => {
    if (!audioContextRef.current || isMutedRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const noteGain = audioContextRef.current.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = isAccent ? 1200 : 800;

    // Use a per-note gain node to avoid interfering with global gain or concurrent notes
    noteGain.gain.setValueAtTime(0, time);
    noteGain.gain.linearRampToValueAtTime(0.3, time + 0.001);
    noteGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    oscillator.connect(noteGain);
    noteGain.connect(gainNodeRef.current || audioContextRef.current.destination);

    oscillator.start(time);
    oscillator.stop(time + 0.1);
  }, []);

  // Advanced timing mechanism using AudioContext's currentTime
  const scheduler = useCallback(() => {
    if (!audioContextRef.current) return;

    const context = audioContextRef.current;
    const currentTime = context.currentTime;
    const secondsPerBeat = 60.0 / bpm;

    // Schedule notes ahead of time for precise timing
    while (nextNoteTimeRef.current < currentTime + 0.1) {
      if (countInTargetRef.current > 0) {
        scheduleNote(nextNoteTimeRef.current, countInTargetRef.current === 4);
        setCountInRemaining(countInTargetRef.current);
        countInTargetRef.current -= 1;
      } else {
        if (startTimeRef.current === null) {
          startTimeRef.current = Date.now();
          audioStartTimeRef.current = audioContextRef.current.currentTime;
          beatCounterRef.current = 0;
          setCountInRemaining(0);
        }
        scheduleNote(nextNoteTimeRef.current, beatCounterRef.current % 4 === 0);
        beatCounterRef.current += 1;
      }

      nextNoteTimeRef.current += secondsPerBeat;
    }

    // Use lookahead scheduling for better timing accuracy on mobile
    timeoutRef.current = window.setTimeout(scheduler, 25);
  }, [bpm, scheduleNote]);

  // Resume audio context if suspended (common on mobile)
  const resumeAudioContext = useCallback(async () => {
    if (audioContextRef.current?.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch (error) {
        console.error("Failed to resume audio context:", error);
      }
    }
  }, []);

  const startMetronome = useCallback(() => {
    if (!initializeAudio()) return;

    resumeAudioContext();

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    if (audioContextRef.current) {
      nextNoteTimeRef.current = audioContextRef.current.currentTime;
      countInTargetRef.current = 4;
      setCountInRemaining(4);
      startTimeRef.current = null;
      audioStartTimeRef.current = null;
      beatCounterRef.current = 0;
      scheduler();
    }

    setIsPlaying(true);
  }, [initializeAudio, resumeAudioContext, scheduler]);

  const stopMetronome = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Silence any ongoing sound
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.cancelScheduledValues(audioContextRef.current.currentTime);
      gainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current.currentTime);
    }

    startTimeRef.current = null;
    audioStartTimeRef.current = null;
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

  // Handle visibility change (audio often pauses when app goes to background on mobile)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying) {
        stopMetronome();
      } else if (!document.hidden && isPlaying) {
        resumeAudioContext();
      }

    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPlaying, stopMetronome, resumeAudioContext]);

  // Clean up resources
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }

      audioContextRef.current?.close();
    };
  }, []);

  // Handle BPM changes while playing
  useEffect(() => {
    if (isPlaying && countInRemaining === 0 && startTimeRef.current) {
      stopMetronome();
      startMetronome();
    }
  }, [bpm]);

  const handleSetRecommendedBpm = useCallback(() => {
    setBpm(recommendedBpm);
  }, [recommendedBpm]);

  // Expose the same interface as the original hook
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
    initializeAudio,
    audioInitialized,
    startTime: startTimeRef.current,
    audioContext: audioContextRef.current,
    audioStartTime: audioStartTimeRef.current,
  };
}; 
