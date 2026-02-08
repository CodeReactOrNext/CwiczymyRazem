import { useCallback, useEffect, useRef, useState } from "react";
import { TablatureMeasure } from "../types/exercise.types";

interface UseTablatureAudioProps {
  measures?: TablatureMeasure[];
  bpm: number;
  isPlaying: boolean;
  startTime: number | null;
  isMuted?: boolean;
  onLoopComplete?: () => void;
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
  isMuted = false,
  onLoopComplete
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

  // Pre-calculate cumulative beat durations to allow absolute time scheduling
  const cumulativeBeatsRef = useRef<number[]>([]);

  useEffect(() => {
    if (!measures) {
      flattenedBeatsRef.current = [];
      cumulativeBeatsRef.current = [];
      return;
    }
    const flattened = measures.flatMap(m => m.beats);
    flattenedBeatsRef.current = flattened;

    // Calculate cumulative duration in beats for each note/beat event
    let total = 0;
    const cumulatives = [0];
    flattened.forEach(b => {
      total += b.duration;
      cumulatives.push(total);
    });
    cumulativeBeatsRef.current = cumulatives;
  }, [measures]);

  const scheduler = useCallback(() => {
    if (!audioContextRef.current || !isPlaying || flattenedBeatsRef.current.length === 0 || !startTime) return;

    const ctx = audioContextRef.current;
    const lookahead = 0.1; // 100ms window

    // 1. Calculate the "Anchor Time" in AudioContext coordinates
    // This is the moment in ctx.currentTime when the metronome started (startTime)
    // We assume audioContext runs in real-time seconds, same as Date.now() / 1000 roughly
    // drift calculation:
    const timeSinceStart = (Date.now() - startTime) / 1000;
    const anchorTime = ctx.currentTime - timeSinceStart;

    const secondsPerBeat = 60 / bpm;
    const totalDurationBeats = cumulativeBeatsRef.current[cumulativeBeatsRef.current.length - 1];

    // We only need to check beats that fall within [currentTime, currentTime + lookahead]
    // But since it's a loop, we calculate time modulo total duration

    // Optimization: Instead of modulo math on every frame for every note (can be expensive if track is long),
    // we determine which "copy" of the loop we are in or just check the next expected note index.
    // However, to strictly fix drift, we shouldn't rely on "nextNoteTimeRef" incrementing. 
    // We should calculate "absolute time of beat N" and see if it's due.

    // For this implementation, since riddles are short, we can iterate properly.
    // Let's stick thereto the robust "nextNoteTime" but RE-ALIGN it to anchor every frame if needed?
    // actually, best way is to calculate nextNoteTimeRef based on currentBeatIndex and anchor.

    // Let's assume we are just scheduling the NEXT beat.
    // Absolute time of the current beat index in the CURRENT loop iteration:
    // We need to track how many full loops have passed? 
    // Or just: timeSinceStart / totalDurationSeconds -> integer part is loops.

    const totalDurationSeconds = totalDurationBeats * secondsPerBeat;

    // Find the start time of the current loop iteration
    const loopsCompleted = Math.floor(timeSinceStart / totalDurationSeconds);
    const currentLoopStart = anchorTime + (loopsCompleted * totalDurationSeconds);
    const nextLoopStart = currentLoopStart + totalDurationSeconds;

    // Check notes in current loop
    // But wait, if we are near the end of a loop, we might need to schedule start of NEXT loop.

    // Let's look at the beat index we are currently tracking.
    let beatIndex = currentBeatIndexRef.current;

    // Calculate absolute scheduled time for this beat
    // relative beat start (beats) * secondsPerBeat + loopStart
    let beatStartTime = cumulativeBeatsRef.current[beatIndex] * secondsPerBeat;

    // We need to resolve which "loop" this beat belongs to. 
    // It should be the one strictly after ctx.currentTime (or just before).
    // Actually, simply:
    // ScheduledTime = anchorTime + (loopsCompleted * totalDurationSeconds) + beatStartTime
    // If this time is in the past, maybe it's the NEXT loop? 
    // If (ScheduledTime < ctx.currentTime - tolerance), it means we missed it or likely belong to next loop.

    // Easier approach: Just keep incrementing "next absolute time"
    // To fix drift: Re-calculate "next absolute time" if it drifts too far? 
    // No, better: "Expected Time" = anchor + absolute_beat_count * secondsPerBeat.

    // Let's stick to the simplest Robust Logic:
    // Use `nextNoteTimeRef` but INITIALIZE it accurately from `startTime` whenever we reset.
    // And to prevent drift, we refrain from "adding" to it, and instead re-compute it from index?
    // `nextNoteTime = anchorTime + (totalBeatsPlayed * secondsPerBeat)`

    // But we don't track totalBeatsPlayed easily across loops.
    // Let's try the Hybrid:
    // Sync `nextNoteTimeRef` to `anchorTime` on first run, then just increment.
    // AudioClock is precise. Drift usually comes from `Date.now` vs `AudioClock` mismatch in the METRONOME hook.
    // HERE, if we strictly use `secondsPerBeat`, we are internally consistent.
    // The issue is `useDeviceMetronome` creates `startTime` based on `Date.now()`.

    // CRITICAL FIX: If `startTime` changes, we MUST reset our scheduling cursor.
    // This is handled in the effect below.

    // Just ensure we don't schedule if startTime is in the future (count-in).
    // (Handled by `if (!startTime)` check - startTime is null during count-in).

    while (nextNoteTimeRef.current < ctx.currentTime + lookahead) {
      const beat = flattenedBeatsRef.current[currentBeatIndexRef.current];

      // Schedule notes
      beat.notes.forEach((n: any) => {
        const baseFreq = STRING_FREQS[n.string - 1];
        const freq = baseFreq * Math.pow(2, n.fret / 12);
        playNote(freq, nextNoteTimeRef.current);
      });

      // Advance
      nextNoteTimeRef.current += beat.duration * secondsPerBeat;
      currentBeatIndexRef.current = (currentBeatIndexRef.current + 1) % flattenedBeatsRef.current.length;

      // If we wrapped around, loop complete
      if (currentBeatIndexRef.current === 0 && flattenedBeatsRef.current.length > 0) {
        onLoopComplete?.();
      }
    }

    timeoutRef.current = window.setTimeout(scheduler, 25);
  }, [bpm, isPlaying, playNote, startTime, onLoopComplete]);

  useEffect(() => {
    if (isPlaying && startTime) { // Only start if we have a startTime (count-in done)
      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume();
      }

      if (audioContextRef.current) {
        // RESET Logic:
        // Calculate where we should be exactly based on startTime
        const ctx = audioContextRef.current;
        const timeSinceStart = (Date.now() - startTime) / 1000;

        // This is tricky because "timeSinceStart" might be middle of a measures if we unpaused?
        // But for Ear Training, we always restart from 0 on "Guessed" (new riddle).
        // For simple pause/play, `startTime` in metronome is reset to "now - elapsed".
        // So `timeSinceStart` should effectively be "how long have we been playing this track".

        // However, `useDeviceMetronome` manages `startTime` logic.
        // If we just started (or count-in finished), `timeSinceStart` is ~0.
        // We want to schedule the FIRST beat at `ctx.currentTime + (0 - small_delay?)` or just `ctx.currentTime`.
        // Actually, we want to align with `startTime`.
        // `AudioContextTime` corresponding to `startTime` is `ctx.currentTime - timeSinceStart`.

        const anchorTime = ctx.currentTime - timeSinceStart;

        // If we are starting fresh (timeSinceStart is small), start at index 0
        // If resuming, we technically need to seek, but Ear Training is short loops.
        // Let's assume restart from 0 for consistency with the "Next Riddle" flow.

        // To strictly sync first beat:
        // nextNoteTime should be exactly anchorTime (plus maybe existing played beats duration if seeking).
        // Assuming playback always starts from beat 0 when startTime resets:

        // FIX: Do NOT clamp to ctx.currentTime. If we are slightly late (offset), we must schedule in the "past" (anchor)
        // so that the AudioContext catches up and subsequent notes are aligned to the grid, not to the "late start".
        nextNoteTimeRef.current = anchorTime;

        currentBeatIndexRef.current = 0;
        scheduler();
      }
    } else {
      // Stop/Pause
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [isPlaying, scheduler, measures, startTime]); // triggered when startTime updates (count-in finishes)

  return null;
};
