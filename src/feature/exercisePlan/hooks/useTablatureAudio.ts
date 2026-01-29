import { useCallback, useEffect, useRef, useState } from "react";
import { TablatureMeasure } from "../types/exercise.types";

interface UseTablatureAudioProps {
  measures?: TablatureMeasure[];
  bpm: number;
  isPlaying: boolean;
  startTime: number | null;
  isMuted?: boolean;
}

const STRING_FREQS = [
  329.63, // 1: E
  246.94, // 2: B
  196.00, // 3: G
  146.83, // 4: D
  110.00, // 5: A
  82.41,  // 6: E
];

export const useTablatureAudio = ({
  measures,
  bpm,
  isPlaying,
  startTime,
  isMuted = false
}: UseTablatureAudioProps) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Audio state tracking
  const nextNoteTimeRef = useRef<number>(0);
  const currentBeatIndexRef = useRef<number>(0);
  const flattenedBeatsRef = useRef<any[]>([]);

  // Initialize Audio
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.connect(audioContextRef.current.destination);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      audioContextRef.current?.close();
    };
  }, []);

  // Pre-process beats for easier scheduling
  useEffect(() => {
    if (!measures) {
      flattenedBeatsRef.current = [];
      return;
    }
    const flattened = measures.flatMap(m => m.beats);
    flattenedBeatsRef.current = flattened;
  }, [measures]);

  // Handle Mute
  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      const targetGain = isMuted ? 0 : 1;
      gainNodeRef.current.gain.setTargetAtTime(targetGain, audioContextRef.current.currentTime, 0.01);
    }
  }, [isMuted]);

  const playNote = useCallback((freq: number, time: number) => {
    if (!audioContextRef.current || !gainNodeRef.current || isMuted) return;
    const ctx = audioContextRef.current;

    // Clean Electric Synthesis
    const osc1 = ctx.createOscillator(); // Fundamental
    const osc2 = ctx.createOscillator(); // Subtle 2nd harmonic
    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const bodyFilter = ctx.createBiquadFilter();
    const pluckGain = ctx.createGain();

    // Fundamental (Triangle for string body)
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(freq, time);

    // Overtone (Sine for warmth)
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 2, time);
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.1, time); // Subtle harmonic

    // Pick Attack (White Noise Burst - very short)
    const bufferSize = ctx.sampleRate * 0.01;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    noise.buffer = buffer;

    // Filter - Characteristic clean electric cutoff
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(4500, time);
    filter.frequency.exponentialRampToValueAtTime(1200, time + 0.15);
    filter.Q.value = 1.5;

    // Body Resonance (Fixed peak around 150-300Hz)
    bodyFilter.type = "peaking";
    bodyFilter.frequency.value = 200;
    bodyFilter.Q.value = 0.5;
    bodyFilter.gain.value = 3;

    // Volume Envelope
    pluckGain.gain.setValueAtTime(0, time);
    pluckGain.gain.linearRampToValueAtTime(0.25, time + 0.003); // Quick attack
    pluckGain.gain.exponentialRampToValueAtTime(0.001, time + 1.5); // Natural decay

    osc1.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    noise.connect(filter);

    filter.connect(bodyFilter);
    bodyFilter.connect(pluckGain);
    pluckGain.connect(gainNodeRef.current);

    osc1.start(time);
    osc2.start(time);
    noise.start(time);

    osc1.stop(time + 1.5);
    osc2.stop(time + 1.5);
    noise.stop(time + 0.01);
  }, [isMuted]);

  const scheduler = useCallback(() => {
    if (!audioContextRef.current || !isPlaying || flattenedBeatsRef.current.length === 0) return;

    const ctx = audioContextRef.current;
    const lookahead = 0.1; // 100ms window

    while (nextNoteTimeRef.current < ctx.currentTime + lookahead) {
      const beat = flattenedBeatsRef.current[currentBeatIndexRef.current];

      // Schedule current beat notes
      beat.notes.forEach((n: any) => {
        const baseFreq = STRING_FREQS[n.string - 1];
        const freq = baseFreq * Math.pow(2, n.fret / 12);
        playNote(freq, nextNoteTimeRef.current);
      });

      // Move to next beat
      const secondsPerBeat = (60 / bpm) * beat.duration;
      nextNoteTimeRef.current += secondsPerBeat;
      currentBeatIndexRef.current = (currentBeatIndexRef.current + 1) % flattenedBeatsRef.current.length;
    }

    timeoutRef.current = window.setTimeout(scheduler, 25);
  }, [bpm, isPlaying, playNote]);

  useEffect(() => {
    if (isPlaying) {
      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume();
      }

      // Sync with visual cursor
      if (audioContextRef.current) {
        nextNoteTimeRef.current = audioContextRef.current.currentTime;
        currentBeatIndexRef.current = 0;
        scheduler();
      }
    }

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isPlaying, scheduler]);

  return null;
};
