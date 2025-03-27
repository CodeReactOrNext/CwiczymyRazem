import { useCallback, useEffect, useRef, useState } from "react";

interface UseMetronomeProps {
  initialBpm: number;
  minBpm: number;
  maxBpm: number;
  recommendedBpm: number;
  onBeat?: (beat: number) => void;
}

export const useMetronome = ({
  initialBpm,
  minBpm,
  maxBpm,
  recommendedBpm,
  onBeat,
}: UseMetronomeProps) => {
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const schedulerTimerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const notesInQueueRef = useRef<{ note: number; time: number }[]>([]);
  const currentBeatRef = useRef<number>(0);
  const lastNotifiedBeatRef = useRef<number>(-1);
  
  const isDraggingRef = useRef(false);

  const lookahead = 25.0;
  const scheduleAheadTime = 0.1;
  
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const scheduleNote = useCallback((beatNumber: number, time: number) => {
    notesInQueueRef.current.push({ note: beatNumber, time: time });
    
    if (!audioContextRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.frequency.value = 1000;
    
    if (beatNumber % 4 === 0) {
      oscillator.frequency.value = 1500;
    }

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(1, time + 0.001);
    gainNode.gain.linearRampToValueAtTime(0, time + 0.05);

    oscillator.start(time);
    oscillator.stop(time + 0.05);
  }, []);

  const checkNotesInQueue = useCallback(() => {
    if (!audioContextRef.current || !onBeat) return;
    
    const currentTime = audioContextRef.current.currentTime;
    
    while (
      notesInQueueRef.current.length > 0 && 
      notesInQueueRef.current[0].time <= currentTime
    ) {
      const note = notesInQueueRef.current[0].note;
      
      if (note !== lastNotifiedBeatRef.current) {
        onBeat(note);
        lastNotifiedBeatRef.current = note;
      }
      
      notesInQueueRef.current.shift();
    }
    
    if (isPlaying && notesInQueueRef.current.length > 0) {
      requestAnimationFrame(checkNotesInQueue);
    }
  }, [onBeat, isPlaying]);

  const scheduler = useCallback(() => {
    if (!audioContextRef.current) return;
    
    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime) {
      scheduleNote(currentBeatRef.current, nextNoteTimeRef.current);
      
      const secondsPerBeat = 60.0 / bpm;
      nextNoteTimeRef.current += secondsPerBeat;
      currentBeatRef.current = (currentBeatRef.current + 1) % 4;
    }
    
    schedulerTimerRef.current = window.setTimeout(() => {
      scheduler();
    }, lookahead);
    
    if (onBeat) {
      requestAnimationFrame(checkNotesInQueue);
    }
  }, [bpm, scheduleNote, checkNotesInQueue, onBeat]);

  const startMetronome = useCallback(() => {
    const audioContext = initAudioContext();
    
    currentBeatRef.current = 0;
    nextNoteTimeRef.current = audioContext.currentTime;
    notesInQueueRef.current = [];
    lastNotifiedBeatRef.current = -1;
    
    scheduler();
    setIsPlaying(true);
  }, [initAudioContext, scheduler]);

  const stopMetronome = useCallback(() => {
    setIsPlaying(false);
    
    if (schedulerTimerRef.current) {
      clearTimeout(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }
    
    notesInQueueRef.current = [];
  }, []);

  const toggleMetronome = useCallback(() => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
  }, [isPlaying, startMetronome, stopMetronome]);

  const handleBpmDragChange = useCallback(
    (newBpm: number[]) => {
      const newBpmValue = newBpm[0];
      setBpm(newBpmValue);
      isDraggingRef.current = true;
    },
    []
  );
  
  const handleBpmDragEnd = useCallback(
    () => {
      isDraggingRef.current = false;
      
      if (isPlaying) {
        stopMetronome();
        setTimeout(startMetronome, 10);
      }
    },
    [isPlaying, startMetronome, stopMetronome]
  );

  const handleBpmChange = useCallback(
    (newBpm: number[]) => {
      const newBpmValue = newBpm[0];
      setBpm(newBpmValue);
      
      if (isPlaying && !isDraggingRef.current) {
        stopMetronome();
        setTimeout(() => {
          startMetronome();
        }, 10);
      }
    },
    [isPlaying, startMetronome, stopMetronome]
  );

  const setRecommendedBpm = useCallback(() => {
    setBpm(recommendedBpm);
    
    if (isPlaying) {
      stopMetronome();
      setTimeout(() => {
        startMetronome();
      }, 10);
    }
  }, [isPlaying, recommendedBpm, startMetronome, stopMetronome]);

  useEffect(() => {
    return () => {
      if (schedulerTimerRef.current) {
        clearTimeout(schedulerTimerRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    bpm,
    isPlaying,
    minBpm,
    maxBpm,
    handleBpmChange,
    handleBpmDragChange,
    handleBpmDragEnd,
    toggleMetronome,
    setRecommendedBpm,
  };
}; 