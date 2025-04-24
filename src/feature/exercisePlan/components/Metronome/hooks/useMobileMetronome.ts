import { useCallback, useEffect, useRef, useState } from "react";

import { isIOSDevice } from "../utils/deviceDetection";

interface UseMobileMetronomeProps {
  initialBpm?: number;
  minBpm?: number;
  maxBpm?: number;
  recommendedBpm?: number;
}

export const useMobileMetronome = ({
  initialBpm = 60,
  minBpm = 40,
  maxBpm = 208,
  recommendedBpm = 60,
}: UseMobileMetronomeProps) => {
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const isIOS = isIOSDevice();
  
  // Initialize audio (must be called on user gesture)
  const initializeAudio = useCallback(() => {
    if (audioInitialized) return true;
    
    try {
      audioContextRef.current = new (window.AudioContext || 
        (window as any).webkitAudioContext)();
      
      // Create persistent nodes for better performance on mobile
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = 0;
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
  const scheduleNote = useCallback((time: number) => {
    if (!audioContextRef.current || !gainNodeRef.current) return;
    
    const oscillator = audioContextRef.current.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 800;
    
    // Connect to the persistent gain node
    oscillator.connect(gainNodeRef.current);
    
    // Schedule precise gain envelope
    gainNodeRef.current.gain.cancelScheduledValues(time);
    gainNodeRef.current.gain.setValueAtTime(0, time);
    gainNodeRef.current.gain.linearRampToValueAtTime(0.3, time + 0.001);
    gainNodeRef.current.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    
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
      scheduleNote(nextNoteTimeRef.current);
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
    if (isPlaying) {
      stopMetronome();
      startMetronome();
    }
  }, [bpm, isPlaying, startMetronome, stopMetronome]);
  
  // Space key handler
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
  
  // Expose the same interface as the original hook
  return {
    bpm,
    isPlaying,
    minBpm,
    maxBpm,
    setBpm,
    toggleMetronome,
    handleSetRecommendedBpm,
    recommendedBpm,
    initializeAudio,
    audioInitialized
  };
}; 