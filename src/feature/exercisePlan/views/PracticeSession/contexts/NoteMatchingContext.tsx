import type { GpPlaybackPosition } from "feature/exercisePlan/hooks/useAlphaTabPlayer";
import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { createContext, type MutableRefObject, type ReactNode,useContext, useEffect, useMemo, useRef } from "react";

import { getChordTones } from "../../../chords/chordTones";
import type { StrumPattern, TablatureMeasure } from "../../../types/exercise.types";
import type { GameState } from "../hooks/noteMatchingFeedback";
import type { ChordHuntState } from "../hooks/useChordHunt";
import { useChordHunt } from "../hooks/useChordHunt";
import type { NoteHuntState } from "../hooks/useNoteHunt";
import { useNoteHunt } from "../hooks/useNoteHunt";
import { useNoteMatching } from "../hooks/useNoteMatching";
import type { SlotResult } from "../hooks/useStrummingMatcher";
import { useStrummingMatcher } from "../hooks/useStrummingMatcher";

// ── Context value (what subscribing components read) ─────────────────────────

interface NoteMatchingContextValue {
  hitNotes: Record<string, boolean | number>;
  missedNotes: Record<string, boolean>;
  currentBeatsElapsedRef: MutableRefObject<number>;
  strumSlotFeedback: Map<number, SlotResult> | undefined;
  gameState: GameState;
  maxPossibleScore: number;
  sessionAccuracy: number;
  /** Live note-hunt state — populated for octave/region/interval modes. */
  noteHunt: NoteHuntState | null;
  /** Live chord-hunt state — populated only for chord-mode exercises. */
  chordHunt: ChordHuntState | null;
  /** Seconds until the hunt target rotates, or null when not rotating. */
  noteHuntSecondsLeft: number | null;
  /** Fret window for region-mode note hunts, or null when not in region mode. */
  noteHuntRegion: { startFret: number; endFret: number } | null;
  /** Prompt shown instead of the answer (interval mode), or null. */
  customGoalPrompt: { title: string; subtitle?: string } | null;
  /** The live hunt target (note name / chord name). Read this — not a prop —
   *  so it updates through memoized content wrappers when the target rotates. */
  huntTarget: string | null;
  /** Live mic volume (0..1) for the detection waveform. */
  volumeRef: MutableRefObject<number>;
  /** Live AlphaTab playback position sink. The notation viewer writes into it while
   *  it owns the audio; note matching reads it as the ground-truth clock. */
  gpPositionRef: MutableRefObject<GpPlaybackPosition | null>;
  /** Manually advance the hunt to the next target (for no-mic practice). */
  advanceHunt: () => void;
  /** Enable the microphone / pitch detection from inside the hunt UI. */
  onEnableMic: () => void;
  /** Toggle an octave as found by hand (no-mic self-check). */
  markNoteHuntOctave: (octave: number) => void;
  /** Toggle a chord tone as found by hand (no-mic self-check). */
  markChordTone: (pitchClass: number) => void;
}

// ── Imperative handle (what PracticeSession reads in event handlers) ──────────

export interface NoteMatchingSnapshot {
  score: number;
  accuracy: number;
  maxCombo: number;
  maxPossibleScore: number;
  noteTimeline: ("hit" | "miss")[];
}

export interface NoteMatchingHandle {
  resetGame: () => void;
  snapshot: () => NoteMatchingSnapshot;
}

// ── Context ───────────────────────────────────────────────────────────────────

const defaultGameState: GameState = { score: 0, combo: 0, multiplier: 1, lastFeedback: "", feedbackId: 0 };

const _fallbackRef = { current: 0 } as MutableRefObject<number>;
const _fallbackGpPositionRef = { current: null } as MutableRefObject<GpPlaybackPosition | null>;

const NoteMatchingContext = createContext<NoteMatchingContextValue>({
  hitNotes: {},
  missedNotes: {},
  currentBeatsElapsedRef: _fallbackRef,
  strumSlotFeedback: undefined,
  gameState: defaultGameState,
  maxPossibleScore: 0,
  sessionAccuracy: 100,
  noteHunt: null,
  chordHunt: null,
  noteHuntSecondsLeft: null,
  noteHuntRegion: null,
  customGoalPrompt: null,
  huntTarget: null,
  volumeRef: _fallbackRef,
  gpPositionRef: _fallbackGpPositionRef,
  advanceHunt: () => { /* no-op default */ },
  onEnableMic: () => { /* no-op default */ },
  markNoteHuntOctave: () => { /* no-op default */ },
  markChordTone: () => { /* no-op default */ },
});

// ── Provider ──────────────────────────────────────────────────────────────────

interface NoteMatchingProviderProps {
  children: ReactNode;
  handleRef: React.MutableRefObject<NoteMatchingHandle | null>;
  // inputs for useNoteMatching
  isPlaying: boolean;
  startTime: number | null;
  /** Playback AudioContext + its start anchor — lets matching follow the audio
   *  clock (what the user hears) instead of the drifting wall clock. */
  audioContext?: AudioContext | null;
  audioStartTime?: number | null;
  /** Live AlphaTab playback position (GP / notation audio) — the ground-truth clock
   *  for matching whenever it's fresh; the anchor clock above is the fallback. */
  gpPositionRef: MutableRefObject<GpPlaybackPosition | null>;
  effectiveBpm: number;
  rawBpm: number;
  activeTablature: TablatureMeasure[] | null | undefined;
  isMicEnabled: boolean;
  currentExerciseIndex: number;
  speedMultiplier: number;
  getLatencyMs: () => number;
  audioRefs: AudioRefs;
  getAdjustedTargetFreq: (string: number, baseFreq: number) => number;
  // per-string semitone offset from standard tuning, for notes without a real midiNote
  tuningOffsets?: readonly number[];
  // inputs for useStrummingMatcher
  activeStrumPattern: StrumPattern | undefined;
  // input for useNoteHunt (customGoal exercises)
  customGoal: string | undefined;
  // fret window for region-mode note hunts (undefined when not in region mode)
  customGoalRegion: { startFret: number; endFret: number } | undefined;
  // prompt shown instead of the answer (interval mode)
  customGoalPrompt: { title: string; subtitle?: string } | undefined;
  // which hunt variant the current exercise is (selects the detection hook)
  noteHuntMode: "octaves" | "region" | "interval" | "chord" | undefined;
  // countdown until the note-hunt target rotates (null when not rotating)
  noteHuntSecondsLeft: number | null;
  // flipped to true once the current hunt goal is fully solved (drives fast-forward)
  solvedRef?: React.MutableRefObject<boolean>;
  // manually advance the hunt to the next target (for no-mic practice)
  onAdvanceHunt: () => void;
  // enable the microphone / pitch detection from inside the hunt UI
  onEnableMic: () => void;
  // callback
  onReset: () => void;
}

export function NoteMatchingProvider({
  children,
  handleRef,
  isPlaying,
  startTime,
  audioContext,
  audioStartTime,
  gpPositionRef,
  effectiveBpm,
  rawBpm,
  activeTablature,
  isMicEnabled,
  currentExerciseIndex,
  speedMultiplier,
  getLatencyMs,
  audioRefs,
  getAdjustedTargetFreq,
  tuningOffsets,
  activeStrumPattern,
  customGoal,
  customGoalRegion,
  customGoalPrompt,
  noteHuntMode,
  noteHuntSecondsLeft,
  solvedRef,
  onAdvanceHunt,
  onEnableMic,
  onReset,
}: NoteMatchingProviderProps) {
  const {
    hitNotes,
    missedNotes,
    sessionAccuracy: tabAccuracy,
    gameState: tabGameState,
    maxCombo,
    maxPossibleScore,
    currentBeatsElapsedRef,
    resetGame,
  } = useNoteMatching({
    isPlaying,
    startTime,
    audioContext,
    audioStartTime,
    gpPositionRef,
    effectiveBpm,
    rawBpm,
    activeTablature,
    isMicEnabled,
    currentExerciseIndex,
    speedMultiplier,
    getLatencyMs,
    audioRefs,
    getAdjustedTargetFreq,
    tuningOffsets,
    onReset,
  });

  const {
    slotFeedback: strumSlotFeedback,
    gameState: strumGameState,
    sessionAccuracy: strumAccuracy,
  } = useStrummingMatcher({
    isPlaying,
    startTime,
    bpm: effectiveBpm,
    pattern: activeStrumPattern,
    isMicEnabled,
    audioRefs,
    getLatencyMs,
    currentExerciseIndex,
  });

  const isHunt = !!customGoal;
  const isChordHunt = isHunt && noteHuntMode === "chord";
  const isNoteHunt = isHunt && !isChordHunt; // octaves / region / interval
  // Stabilise the fret window by its primitive bounds so a fresh object each
  // render doesn't churn the hunt's retarget effect.
  const regionStart = customGoalRegion?.startFret;
  const regionEnd = customGoalRegion?.endFret;
  const fretRange = useMemo<[number, number] | undefined>(
    () => (regionStart !== undefined && regionEnd !== undefined ? [regionStart, regionEnd] : undefined),
    [regionStart, regionEnd],
  );
  const { state: noteHunt, markOctave: markNoteHuntOctave } = useNoteHunt(
    customGoal ?? "",
    audioRefs.frequencyRef,
    audioRefs.volumeRef,
    isMicEnabled && isNoteHunt,
    fretRange,
  );

  // Chord-mode: derive the chord's member pitch classes from its name.
  const chord = useMemo(() => (isChordHunt ? getChordTones(customGoal!) : null), [isChordHunt, customGoal]);
  const { state: chordHunt, markTone: markChordTone } = useChordHunt(
    chord?.tones ?? [],
    chord?.labels ?? [],
    audioRefs.frequencyRef,
    audioRefs.volumeRef,
    isMicEnabled && isChordHunt,
  );

  const huntGameState = isChordHunt ? chordHunt.gameState : noteHunt.gameState;
  const huntAccuracy = isChordHunt ? chordHunt.accuracy : noteHunt.accuracy;
  const huntMaxScore = isChordHunt ? chordHunt.maxPossibleScore : noteHunt.maxPossibleScore;
  const huntMaxCombo = isChordHunt ? chordHunt.maxCombo : noteHunt.maxCombo;

  // Whole goal solved? Chord: all tones. Interval: found the target once. Octave/
  // region: every reachable octave. Reported to the rotation hook so it can
  // fast-forward to the next target.
  const huntComplete = isChordHunt
    ? chordHunt.tones.length > 0 && chordHunt.foundTones.length === chordHunt.tones.length
    : isNoteHunt
      ? noteHuntMode === "interval"
        ? noteHunt.foundOctaves.length >= 1
        : noteHunt.octaves.length > 0 && noteHunt.octaves.every(o => noteHunt.foundOctaves.includes(o))
      : false;
  useEffect(() => {
    if (solvedRef) solvedRef.current = huntComplete;
  }, [huntComplete, solvedRef]);

  const isStrummingExercise = !!activeStrumPattern;
  const gameState = isHunt ? huntGameState : isStrummingExercise ? strumGameState : tabGameState;
  const sessionAccuracy = isHunt ? huntAccuracy : isStrummingExercise ? strumAccuracy : tabAccuracy;
  const effectiveMaxPossibleScore = isHunt ? huntMaxScore : maxPossibleScore;
  const effectiveMaxCombo = isHunt ? huntMaxCombo : maxCombo;

  // noteTimeline is only needed for the end-of-session snapshot
  const tabNoteTimeline = useMemo((): ("hit" | "miss")[] => {
    const keys = new Set([...Object.keys(hitNotes), ...Object.keys(missedNotes)]);
    return Array.from(keys)
      .sort((a, b) => {
        const [ma, ba, na] = a.split("-").map(Number);
        const [mb, bb, nb] = b.split("-").map(Number);
        if (ma !== mb) return ma - mb;
        if (ba !== bb) return ba - bb;
        return na - nb;
      })
      .map(key => (hitNotes[key] ? "hit" : "miss"));
  }, [hitNotes, missedNotes]);

  // For the hunts, the timeline is one "hit" per unit found (octave / chord tone)
  // plus a "miss" for each still missing — so the success screen shows real progress.
  const noteTimeline = useMemo((): ("hit" | "miss")[] => {
    if (isChordHunt) {
      const total = chordHunt.tones.length;
      const found = chordHunt.maxCombo;
      return Array.from({ length: total }, (_, i) => (i < found ? "hit" : "miss"));
    }
    if (isNoteHunt) {
      const total = noteHunt.octaves.length;
      const found = noteHunt.maxCombo;
      return Array.from({ length: total }, (_, i) => (i < found ? "hit" : "miss"));
    }
    return tabNoteTimeline;
  }, [isChordHunt, chordHunt.tones.length, chordHunt.maxCombo, isNoteHunt, noteHunt.octaves.length, noteHunt.maxCombo, tabNoteTimeline]);

  // Always-current ref so snapshot() never reads stale closure values
  const latestRef = useRef({ score: 0, accuracy: 100, maxCombo: 0, maxPossibleScore: 0, noteTimeline: [] as ("hit" | "miss")[] });
  latestRef.current = { score: gameState.score, accuracy: sessionAccuracy, maxCombo: effectiveMaxCombo, maxPossibleScore: effectiveMaxPossibleScore, noteTimeline };

  // Populate the imperative handle on every render — safe, it's just a ref assignment
  handleRef.current = {
    resetGame,
    snapshot: () => ({ ...latestRef.current }),
  };

  const value = useMemo<NoteMatchingContextValue>(
    () => ({
      hitNotes, missedNotes, currentBeatsElapsedRef, strumSlotFeedback, gameState,
      maxPossibleScore: effectiveMaxPossibleScore, sessionAccuracy,
      noteHunt: isNoteHunt ? noteHunt : null,
      chordHunt: isChordHunt ? chordHunt : null,
      noteHuntSecondsLeft: isHunt ? noteHuntSecondsLeft : null,
      noteHuntRegion: isNoteHunt && fretRange ? { startFret: fretRange[0], endFret: fretRange[1] } : null,
      customGoalPrompt: isHunt ? (customGoalPrompt ?? null) : null,
      huntTarget: isHunt ? (customGoal ?? null) : null,
      volumeRef: audioRefs.volumeRef,
      gpPositionRef,
      advanceHunt: onAdvanceHunt,
      onEnableMic,
      markNoteHuntOctave,
      markChordTone,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hitNotes, missedNotes, strumSlotFeedback, gameState, effectiveMaxPossibleScore, sessionAccuracy, isNoteHunt, noteHunt, isChordHunt, chordHunt, isHunt, noteHuntSecondsLeft, fretRange, customGoalPrompt, customGoal, onAdvanceHunt, onEnableMic, markNoteHuntOctave, markChordTone],
  );

  return (
    <NoteMatchingContext.Provider value={value}>
      {children}
    </NoteMatchingContext.Provider>
  );
}

// ── Consumer hook ─────────────────────────────────────────────────────────────

export function useNoteMatchingContext() {
  return useContext(NoteMatchingContext);
}
