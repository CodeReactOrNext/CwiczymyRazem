import { onOutputDeviceChange, readPersistedOutputDeviceId } from "hooks/useNativeOutputDevice";
import type { MutableRefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { applySinkId } from "utils/applyAudioSinkId";

import type { TempoRuler } from "../../../views/PracticeSession/hooks/tempoBeatClock";
import {
  type AccentLevel,
  cycleAccentLevel,
  DEFAULT_ACCENT_PATTERN,
  getAccentLevel,
  type GridUnit,
  resizeAccentPattern,
  stepsPerBeat as stepsPerBeatOf,
  subdivisionCountFor,
} from "../utils/accentPattern";
import { CLICK_TONES, type ClickKind } from "../utils/clickTones";
import { getCountInBeats } from "../utils/countInDuration";
import { isIOSDevice } from "../utils/deviceDetection";
import type { MetronomeGrid } from "../utils/meterGrid";

interface UseMobileMetronomeProps {
  initialBpm?: number;
  minBpm?: number;
  maxBpm?: number;
  recommendedBpm?: number;
  isMuted?: boolean;
  speedMultiplier?: number;
  enabled?: boolean;
  /** Tempo curve the click follows — see the same prop on useMetronome. */
  tempoRulerRef?: MutableRefObject<TempoRuler | null>;
  onPlayStart?: () => void;
  /** Called on every ~25ms scheduler tick — use to drive external schedulers */
  onTick?: () => void;
  /**
   * When provided the metronome schedules its sounds on this context instead of
   * creating an internal one.  Pass AlphaTab's AudioContext when a GP file is active
   * so that metronome clicks and GP audio share the same audio graph / clock.
   */
  externalAudioContext?: AudioContext | null;
}

export const useMobileMetronome = ({
  initialBpm = 60,
  minBpm = 40,
  maxBpm = 208,
  recommendedBpm = 60,
  isMuted = false,
  speedMultiplier = 1,
  enabled = true,
  tempoRulerRef,
  onPlayStart,
  onTick,
  externalAudioContext,
}: UseMobileMetronomeProps) => {
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countInRemaining, setCountInRemaining] = useState<number>(0);
  const [audioInitialized, setAudioInitialized] = useState(false);
  // 0..1 click volume. ~0.35 maps to the historical 0.3 peak gain; 1 peaks at 0.85.
  const [volume, setVolume] = useState(0.5);
  // Clicks per beat: 1 = plain quarter notes (no subdivision), 2 = eighth notes,
  // 3 = eighth-note triplets, 4 = sixteenth notes.
  const [subdivision, setSubdivision] = useState(1);
  // One entry per beat in the bar — its length *is* the time signature's
  // numerator (custom meters), each entry's value is that beat's accent level.
  const [accentPattern, setAccentPattern] = useState<AccentLevel[]>(DEFAULT_ACCENT_PATTERN);
  // What one accentPattern entry is worth — a quarter (4, the default) or an eighth (8).
  // See GridUnit; mirrors useMetronome so both devices click a meter the same way.
  const [gridUnit, setGridUnit] = useState<GridUnit>(4);
  // Read-only click grid — set by an exercise the grid itself belongs to (the
  // meter drills). See accentLocked in useMetronome.
  const [accentLocked, setAccentLocked] = useState(false);
  // How the current grid reads — see gridLabel in useMetronome.
  const [gridLabel, setGridLabel] = useState<string | null>(null);
  // Entries per bar — see gridBarLengths in useMetronome.
  const [gridBarLengths, setGridBarLengths] = useState<number[] | null>(null);
  // Which beat in the pattern is currently sounding — drives the UI's playhead highlight.
  const [currentBeat, setCurrentBeat] = useState(0);
  // Playback anchor mirrored into React state. The refs are set by the scheduler
  // on the first scheduled beat, which on a skipCountIn start (loop restart,
  // live seek) changes no state at all — without this mirror the memoized
  // return value would keep exposing startTime/audioStartTime = null forever.
  const [playbackAnchor, setPlaybackAnchor] = useState<{ wall: number | null; audio: number | null }>({ wall: null, audio: null });

  const audioContextRef    = useRef<AudioContext | null>(null);
  const ownsAudioContextRef= useRef(true);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const audioStartTimeRef = useRef<number | null>(null);
  const countInTargetRef = useRef<number>(0);
  // Count-in length in quarter notes — one 4/4 bar, or two at fast tempos. See
  // getCountInBeats.
  const countInStartRef  = useRef<number>(4);
  const beatCounterRef = useRef<number>(0);
  // Accent-grid entries sounded so far — the index into accentPattern. Separate
  // from beatCounterRef, which is bumped at the start of a beat and so names the
  // next one for the rest of it. See the same ref in useMetronome.
  const stepCounterRef = useRef<number>(0);
  // Position within the current beat's subdivision grid — 0 is always the beat
  // itself, anything else is a subdivision tick between beats.
  const subdivisionIndexRef = useRef<number>(0);
  const isIOS = isIOSDevice();
  const isMutedRef = useRef(isMuted);
  // Mirrors accentLocked for the edit callbacks — see useMetronome.
  const accentLockedRef = useRef(false);
  const volumeRef = useRef(volume);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  const onPlayStartRef = useRef(onPlayStart);
  const onTickRef      = useRef(onTick);
  useEffect(() => { onPlayStartRef.current = onPlayStart; }, [onPlayStart]);
  useEffect(() => { onTickRef.current = onTick; },         [onTick]);
  const pausedElapsedTimeRef = useRef<number>(0);
  const pausedAudioElapsedRef = useRef<number>(0);
  // Beat position the next GP playback (AlphaTab) should seek to, or null to
  // start/resume normally. Set by seekToBeats, cleared on restart, consumed once
  // by the AlphaTab player before it calls play() — keeps GP audio aligned with
  // bar-click seeks.
  const pendingSeekBeatRef = useRef<number | null>(null);

  useEffect(() => {
    isMutedRef.current = isMuted;

    // Also update global gain node if it exists (for extra safety)
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(isMuted ? 0 : 1, audioContextRef.current.currentTime, 0.01);
    }
  }, [isMuted]);

  useEffect(() => {
    setBpm(initialBpm);
  }, [initialBpm]);

  // Move an already-open, app-owned context to a newly picked output device live.
  // Never touches an adopted/external context — its owner (AlphaTab) applies its own.
  useEffect(() => onOutputDeviceChange((id) => {
    if (ownsAudioContextRef.current && audioContextRef.current) applySinkId(audioContextRef.current, id);
  }), []);

  // When the external context changes, adopt it (replacing the internal one if any).
  useEffect(() => {
    if (!externalAudioContext || !enabled) return;
    // Close the previously self-created context if we owned it.
    if (ownsAudioContextRef.current && audioContextRef.current) {
      audioContextRef.current.close();
    }
    ownsAudioContextRef.current = false;
    audioContextRef.current = externalAudioContext;
    // Recreate the gain node on the new context.
    gainNodeRef.current = externalAudioContext.createGain();
    gainNodeRef.current.gain.value = isMutedRef.current ? 0 : 1;
    gainNodeRef.current.connect(externalAudioContext.destination);
    setAudioInitialized(true);
   
  }, [externalAudioContext, enabled]);

  // Initialize audio (must be called on user gesture)
  const initializeAudio = useCallback(() => {
    if (!enabled || audioInitialized) return true;
    // If an external context was already adopted, no further init needed.
    if (externalAudioContext) {
      setAudioInitialized(true);
      return true;
    }

    try {
      ownsAudioContextRef.current = true;
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      applySinkId(audioContextRef.current, readPersistedOutputDeviceId());

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
  const scheduleNote = useCallback((time: number, kind: ClickKind = 'beat') => {
    if (!audioContextRef.current || isMutedRef.current) return;

    const { frequency, gainScale } = CLICK_TONES[kind];
    const peak = 0.85 * volumeRef.current * gainScale;
    if (peak <= 0.0001) return;

    const oscillator = audioContextRef.current.createOscillator();
    const noteGain = audioContextRef.current.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    // Use a per-note gain node to avoid interfering with global gain or concurrent notes
    noteGain.gain.setValueAtTime(0, time);
    noteGain.gain.linearRampToValueAtTime(peak, time + 0.001);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);

    oscillator.connect(noteGain);
    noteGain.connect(gainNodeRef.current || audioContextRef.current.destination);

    oscillator.start(time);
    oscillator.stop(time + 0.1);
  }, []);

  // Advanced timing mechanism using AudioContext's currentTime
  const scheduler = useCallback(() => {
    if (!audioContextRef.current) return;

    onTickRef.current?.();

    const context = audioContextRef.current;
    const currentTime = context.currentTime;
    const secondsPerBeat   = 60.0 / (bpm * speedMultiplier);
    const subdivisionCount = subdivisionCountFor(subdivision, gridUnit);
    const stepsPerBeat     = stepsPerBeatOf(gridUnit);
    // Whole number by construction — an eighth grid forces an even tick count.
    const ticksPerStep     = subdivisionCount / stepsPerBeat;

    // Tempo automation in warped-beat space — see the same block in useMetronome.
    const ruler = tempoRulerRef?.current ?? null;
    const hasTempoMap = !!ruler && !ruler.isConstant;
    const warped = (beat: number) => (hasTempoMap ? ruler!.toWarped(beat) : beat);
    const stepSeconds = (fromBeat: number, beats: number): number =>
      (warped(fromBeat + beats) - warped(fromBeat)) * secondsPerBeat;

    // Schedule notes ahead of time for precise timing
    while (nextNoteTimeRef.current < currentTime + 0.1) {
      if (countInTargetRef.current > 0) {
        // Always a plain 4/4 bar of quarter notes, whatever grid the exercise plays
        // in — see COUNT_IN_BEATS. Subdivision only kicks in once real playback starts.
        const countInBeatIndex = countInStartRef.current - countInTargetRef.current;
        const countInLevel     = getAccentLevel(DEFAULT_ACCENT_PATTERN, countInBeatIndex);
        scheduleNote(nextNoteTimeRef.current, countInLevel === 2 ? 'accent' : 'beat');
        setCountInRemaining(countInTargetRef.current);
        countInTargetRef.current -= 1;
        // The count-in leads into bar 1, so it ticks at bar 1's tempo — one whole
        // quarter note at a time, independent of what a grid entry is worth.
        nextNoteTimeRef.current  += stepSeconds(0, 1);
      } else {
        // Only a true beat (subdivision index 0) drives the playback anchor and the
        // 4-beat accent grid — subdivision ticks in between are just extra clicks.
        const isBeat = subdivisionIndexRef.current === 0;

        if (isBeat && startTimeRef.current === null) {
          // Account for lookahead: startTime should reflect when the beat will actually play,
          // not when it is scheduled. This prevents the cursor from being ~100ms ahead.
          const msUntilBeat = Math.max(0, (nextNoteTimeRef.current - context.currentTime) * 1000);
          startTimeRef.current = Date.now() + msUntilBeat - pausedElapsedTimeRef.current;
          if (audioContextRef.current) {
            audioStartTimeRef.current = nextNoteTimeRef.current - (pausedAudioElapsedRef.current / 1000);
          }
          beatCounterRef.current = 0;
          stepCounterRef.current = 0;
          onPlayStartRef.current?.();
          setCountInRemaining(0);
          setPlaybackAnchor({ wall: startTimeRef.current, audio: audioStartTimeRef.current });
        }

        // Where this tick sits in the score, which under a tempo map decides the gap
        // to the next one. beatCounterRef is bumped on the tick that opens a beat, so
        // for the rest of that beat it already names the next one — see useMetronome.
        const beatAtTick  = beatCounterRef.current - (subdivisionIndexRef.current === 0 ? 0 : 1);
        const tickBeatPos = beatAtTick + subdivisionIndexRef.current / subdivisionCount;

        // Accents belong to grid entries, not beats — the same tick under a quarter
        // grid, every other tick under an eighth one.
        const isStep = subdivisionIndexRef.current % ticksPerStep === 0;
        if (isStep) {
          const stepIndex = stepCounterRef.current;
          const level     = getAccentLevel(accentPattern, stepIndex);
          if (level !== 0) scheduleNote(nextNoteTimeRef.current, level === 2 ? 'accent' : 'beat');
          stepCounterRef.current += 1;
          setCurrentBeat(accentPattern.length > 0 ? stepIndex % accentPattern.length : 0);
        } else {
          scheduleNote(nextNoteTimeRef.current, 'sub');
        }
        if (isBeat) beatCounterRef.current += 1;

        subdivisionIndexRef.current = (subdivisionIndexRef.current + 1) % subdivisionCount;
        nextNoteTimeRef.current    += stepSeconds(tickBeatPos, 1 / subdivisionCount);
      }
    }

    // Use lookahead scheduling for better timing accuracy on mobile
    timeoutRef.current = window.setTimeout(scheduler, 25);
  }, [bpm, speedMultiplier, subdivision, gridUnit, accentPattern, scheduleNote]);

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

  const startMetronome = useCallback((options?: { skipCountIn?: boolean }) => {
    if (!initializeAudio()) return;

    resumeAudioContext();

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    if (audioContextRef.current) {
      const useCountIn   = !options?.skipCountIn;
      const countInBeats = getCountInBeats(bpm * (speedMultiplier || 1));
      nextNoteTimeRef.current   = audioContextRef.current.currentTime;
      countInTargetRef.current  = useCountIn ? countInBeats : 0;
      countInStartRef.current   = countInBeats;
      setCountInRemaining(useCountIn ? countInBeats : 0);
      startTimeRef.current      = null;
      audioStartTimeRef.current = null;
      beatCounterRef.current    = 0;
      subdivisionIndexRef.current = 0;
      setPlaybackAnchor({ wall: null, audio: null });
      setCurrentBeat(0);
      scheduler();
    }

    setIsPlaying(true);
  }, [initializeAudio, resumeAudioContext, scheduler, bpm, speedMultiplier]);

  const stopMetronome = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (startTimeRef.current !== null) {
      pausedElapsedTimeRef.current = Date.now() - startTimeRef.current;
    }
    if (audioStartTimeRef.current !== null && audioContextRef.current) {
      pausedAudioElapsedRef.current = (audioContextRef.current.currentTime - audioStartTimeRef.current) * 1000;
    }

    startTimeRef.current = null;
    audioStartTimeRef.current = null;
    countInTargetRef.current = 0;
    setCountInRemaining(0);
    setPlaybackAnchor({ wall: null, audio: null });
    setIsPlaying(false);
  }, []);

  const restartMetronome = useCallback(() => {
    stopMetronome();
    // Reset AFTER stopMetronome so it doesn't save paused elapsed on stop
    pausedElapsedTimeRef.current = 0;
    pausedAudioElapsedRef.current = 0;
    beatCounterRef.current = 0;
    subdivisionIndexRef.current = 0;
    pendingSeekBeatRef.current = null; // back to the top → GP audio starts at 0
  }, [stopMetronome]);

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

      if (ownsAudioContextRef.current) audioContextRef.current?.close();
    };
  }, []);

  // Handle BPM changes while playing
  useEffect(() => {
    if (isPlaying && countInRemaining === 0 && startTimeRef.current) {
      stopMetronome();
      // Reset position so BPM change always restarts from the beginning (beat 0)
      pausedElapsedTimeRef.current  = 0;
      pausedAudioElapsedRef.current = 0;
      startMetronome();
    }
  }, [bpm]);

  const handleSetRecommendedBpm = useCallback(() => {
    setBpm(recommendedBpm);
  }, [recommendedBpm]);

  // Change the meter's beat count (its numerator, e.g. 4/4 → 5/4). New beats
  // start as plain clicks; existing accents are kept.
  const setBeatsPerBar = useCallback((count: number) => {
    if (accentLockedRef.current) return;
    setAccentPattern((prev) => resizeAccentPattern(prev, count));
  }, []);

  // Click-to-cycle a single beat's accent: plain → accent → muted → plain.
  const cycleBeatAccent = useCallback((index: number) => {
    if (accentLockedRef.current) return;
    setAccentPattern((prev) => prev.map((level, i) => (i === index ? cycleAccentLevel(level) : level)));
  }, []);

  /** Replace the whole click grid at once — see setAccentGrid in useMetronome. */
  const setAccentGrid = useCallback((grid: MetronomeGrid, locked = false) => {
    setGridUnit(grid.unit);
    setAccentPattern([...grid.pattern]);
    setGridLabel(grid.label ?? null);
    setGridBarLengths(grid.barLengths.length > 1 ? grid.barLengths : null);
    accentLockedRef.current = locked;
    setAccentLocked(locked);
  }, []);

  /**
   * Score beat the next play() will start from.
   *
   * Only meaningful while stopped — it reads the paused anchor, which is stale
   * the moment playback is running. The Align screen draws its playhead here so
   * that pressing Stop leaves a marker on the spot instead of snapping the
   * whole view back to bar 1, and so that clicking the tab to seek shows where
   * the seek landed.
   *
   * Each metronome answers for its own resume rule rather than publishing the
   * raw elapsed time, because the two devices do not share one: this one snaps
   * to a whole beat and the mobile one does not.
   */
  const getResumeBeat = useCallback((): number => {
    const secondsPerBeat = 60.0 / (bpm * (speedMultiplier || 1));
    if (!(secondsPerBeat > 0)) return 0;
    const ruler = tempoRulerRef?.current ?? null;
    const hasTempoMap = !!ruler && !ruler.isConstant;
    // This metronome resumes exactly where it paused, with no snap to a whole
    // beat, so the marker must not round either.
    const warped = (pausedElapsedTimeRef.current / 1000) / secondsPerBeat;
    return Math.max(0, hasTempoMap ? ruler!.fromWarped(warped) : warped);
  }, [bpm, speedMultiplier, tempoRulerRef]);

  const seekToBeats = useCallback((beats: number) => {
    // Use startTimeRef (not React state) so callers can seek immediately after stopMetronome()
    // without waiting for the next React render cycle.
    if (startTimeRef.current !== null) return;
    const secondsPerBeat = 60.0 / (bpm * (speedMultiplier || 1));
    // Score beats in, warped beats out — a seek into a slowed section costs more
    // seconds than beats.
    const ruler = tempoRulerRef?.current ?? null;
    const warpedBeats = ruler && !ruler.isConstant ? ruler.toWarped(beats) : beats;
    const elapsedMs = warpedBeats * secondsPerBeat * 1000;
    pausedElapsedTimeRef.current  = elapsedMs;
    pausedAudioElapsedRef.current = elapsedMs;
    pendingSeekBeatRef.current    = beats; // GP audio jumps here on the next play()
  }, [bpm, speedMultiplier]);

  // Expose the same interface as the original hook
  return useMemo(() => ({
    bpm,
    isPlaying,
    countInRemaining,
    minBpm,
    maxBpm,
    setBpm,
    volume,
    setVolume,
    subdivision,
    setSubdivision,
    accentPattern,
    gridUnit,
    accentLocked,
    gridLabel,
    gridBarLengths,
    setBeatsPerBar,
    cycleBeatAccent,
    setAccentGrid,
    currentBeat,
    toggleMetronome,
    startMetronome,
    stopMetronome,
    restartMetronome,
    seekToBeats,
    pendingSeekBeatRef,
    handleSetRecommendedBpm,
    recommendedBpm,
    getResumeBeat,
    initializeAudio,
    audioInitialized,
    startTime: playbackAnchor.wall,
    audioContext: audioContextRef.current,
    audioStartTime: playbackAnchor.audio,
  }), [
    bpm, isPlaying, countInRemaining, minBpm, maxBpm, setBpm, volume, setVolume,
    subdivision, setSubdivision, accentPattern, gridUnit, accentLocked, gridLabel, gridBarLengths, setBeatsPerBar, cycleBeatAccent, setAccentGrid, currentBeat,
    toggleMetronome, startMetronome, stopMetronome, restartMetronome, seekToBeats,
    getResumeBeat, handleSetRecommendedBpm, recommendedBpm, initializeAudio, audioInitialized,
    playbackAnchor,
  ]);
}; 
