import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { createContext, type MutableRefObject, type ReactNode,useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { NOTES } from "utils/audio/noteUtils";
import { getUniformTuningShift } from "utils/audio/tunings";

import { getChordTones } from "../../../chords/chordTones";
import type { StrumPattern, TablatureMeasure } from "../../../types/exercise.types";
import type { GameState } from "../hooks/noteMatchingFeedback";
import type { ChordHuntState } from "../hooks/useChordHunt";
import { useChordHunt } from "../hooks/useChordHunt";
import type { ClickHuntState } from "../hooks/useClickHunt";
import { useClickHunt } from "../hooks/useClickHunt";
import type { IntervalClickState } from "../hooks/useIntervalClickHunt";
import { useIntervalClickHunt } from "../hooks/useIntervalClickHunt";
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
  /** Live click-hunt state — populated only for click-mode exercises. */
  clickHunt: ClickHuntState | null;
  /** Live interval-drill state — populated only for intervalClick-mode exercises. */
  intervalClickHunt: IntervalClickState | null;
  /** Cumulative progress for "accumulate" mode hunts (distinct notes completed
   *  across rotations, out of 12) — null in every other mode. */
  chromaticProgress: { found: number; total: number } | null;
  /** Seconds until the hunt target rotates, or null when not rotating. */
  noteHuntSecondsLeft: number | null;
  /** Fret window for region-mode note hunts, or null when not in region mode. */
  noteHuntRegion: { startFret: number; endFret: number } | null;
  /** Strings the hunt is restricted to (1 = high e … 6 = low E), or null for the
   *  whole neck. Scopes both detection (which octaves count) and the neck diagram. */
  noteHuntStrings: number[] | null;
  /** Prompt shown instead of the answer (interval mode), or null. */
  customGoalPrompt: { title: string; subtitle?: string } | null;
  /** The live hunt target (note name / chord name). Read this — not a prop —
   *  so it updates through memoized content wrappers when the target rotates. */
  huntTarget: string | null;
  /** Live mic volume (0..1) for the detection waveform. */
  volumeRef: MutableRefObject<number>;
  /** Live detected pitch in Hz (0 = silence) — drives the 3D neck's pitch glow. */
  frequencyRef: MutableRefObject<number>;
  /** Per-string semitone offset from standard tuning (index 0 = string 1 … 5 = string 6). */
  tuningOffsets?: readonly number[];
  /** Manually advance the hunt to the next target (for no-mic practice). */
  advanceHunt: () => void;
  /** Enable the microphone / pitch detection from inside the hunt UI. */
  onEnableMic: () => void;
  /** Toggle an octave as found by hand (no-mic self-check). */
  markNoteHuntOctave: (octave: number) => void;
  /** Toggle a chord tone as found by hand (no-mic self-check). */
  markChordTone: (pitchClass: number) => void;
  /** Register a click on a fretboard cell for click-mode hunts. */
  registerFretClick: (string: number, fret: number) => void;
  /** Register a click on a fretboard cell for the interval drill (root, then interval). */
  registerIntervalClick: (string: number, fret: number) => void;
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

const defaultGameState: GameState = { score: 0, combo: 0, multiplier: 1 };

// Click-hunt exams only (see the mistake-tracking effect below) — 3 wrong
// clicks ends the exam as a failure, regardless of accumulated accuracy.
export const CLICK_EXAM_MISTAKE_LIMIT = 3;

const _fallbackRef = { current: 0 } as MutableRefObject<number>;

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
  clickHunt: null,
  intervalClickHunt: null,
  chromaticProgress: null,
  noteHuntSecondsLeft: null,
  noteHuntRegion: null,
  noteHuntStrings: null,
  customGoalPrompt: null,
  huntTarget: null,
  volumeRef: _fallbackRef,
  frequencyRef: _fallbackRef,
  tuningOffsets: undefined,
  advanceHunt: () => { /* no-op default */ },
  onEnableMic: () => { /* no-op default */ },
  markNoteHuntOctave: () => { /* no-op default */ },
  markChordTone: () => { /* no-op default */ },
  registerFretClick: () => { /* no-op default */ },
  registerIntervalClick: () => { /* no-op default */ },
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
  // strings in play for click- and mic-mode hunts (undefined = all 6)
  customGoalStrings: number[] | undefined;
  // which hunt variant the current exercise is (selects the detection hook)
  noteHuntMode: "octaves" | "region" | "interval" | "chord" | "click" | "accumulate" | "intervalClick" | undefined;
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
  // whether the session is running as a journey exam (gates the click-hunt mistake limit)
  isExamMode?: boolean;
  // fired once when a click-hunt exam hits the mistake limit — PracticeSession
  // uses this to abort the exam immediately as a failure
  onExamFail?: () => void;
}

export function NoteMatchingProvider({
  children,
  handleRef,
  isPlaying,
  startTime,
  audioContext,
  audioStartTime,
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
  customGoalStrings,
  noteHuntMode,
  noteHuntSecondsLeft,
  solvedRef,
  onAdvanceHunt,
  onEnableMic,
  onReset,
  isExamMode = false,
  onExamFail,
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
  const isClickHunt = isHunt && noteHuntMode === "click";
  const isIntervalClickHunt = isHunt && noteHuntMode === "intervalClick";
  const isNoteHunt = isHunt && !isChordHunt && !isClickHunt && !isIntervalClickHunt; // octaves / region / interval / accumulate
  const isAccumulatingHunt = isNoteHunt && noteHuntMode === "accumulate";
  // Note/chord hunts target a bare note name with no string attached, authored as
  // if standard-tuned — on a uniformly detuned guitar (half/whole step down) the
  // pitch that actually needs to come out of the strings shifts by the same amount
  // a tab note would (see getFrequencyFromTab). Alternate tunings with per-string
  // offsets (Drop D, DADGAD, …) have no single shift, so those fall back to 0.
  const huntTuningShift = getUniformTuningShift(tuningOffsets);
  // Stabilise the fret window by its primitive bounds so a fresh object each
  // render doesn't churn the hunt's retarget effect.
  const regionStart = customGoalRegion?.startFret;
  const regionEnd = customGoalRegion?.endFret;
  const fretRange = useMemo<[number, number] | undefined>(
    () => (regionStart !== undefined && regionEnd !== undefined ? [regionStart, regionEnd] : undefined),
    [regionStart, regionEnd],
  );
  // Same treatment for the string scope: keyed by its contents so a fresh array
  // from an exercise spread doesn't retarget the hunt every render.
  const stringsKey = customGoalStrings?.join(",") ?? "";
  const huntStrings = useMemo<number[] | undefined>(
    () => (stringsKey ? stringsKey.split(",").map(Number) : undefined),
    [stringsKey],
  );
  const { state: noteHunt, markOctave: markNoteHuntOctave } = useNoteHunt(
    customGoal ?? "",
    audioRefs.frequencyRef,
    audioRefs.volumeRef,
    isMicEnabled && isNoteHunt,
    fretRange,
    huntStrings,
    huntTuningShift,
  );

  // Chord-mode: derive the chord's member pitch classes from its name.
  const chord = useMemo(() => (isChordHunt ? getChordTones(customGoal!) : null), [isChordHunt, customGoal]);
  const { state: chordHunt, markTone: markChordTone } = useChordHunt(
    chord?.tones ?? [],
    chord?.labels ?? [],
    audioRefs.frequencyRef,
    audioRefs.volumeRef,
    isMicEnabled && isChordHunt,
    huntTuningShift,
  );

  // Click-mode: no mic, no play/pause gating — clicks always register.
  const { state: clickHunt, registerClick: registerFretClick } = useClickHunt(
    customGoal ?? "",
    regionStart ?? 0,
    regionEnd ?? 12,
    huntStrings,
  );

  // Interval-click mode: the prompt's root lives in customGoalPrompt.title and the
  // note the interval lands on is the hidden customGoal — step 1 and step 2 of the
  // same round.
  const { state: intervalClickHunt, registerClick: registerIntervalClick } = useIntervalClickHunt(
    customGoalPrompt?.title ?? "",
    customGoal ?? "",
    regionStart ?? 0,
    regionEnd ?? 12,
    huntStrings,
  );

  // Exam mode, click-answered hunts only: too many wrong clicks fails the exam
  // outright instead of just diluting accuracy — closes the "brute-force every
  // cell" loophole the untimed, unpenalized click drills otherwise leave open.
  const clickMistakeCount = isIntervalClickHunt ? intervalClickHunt.mistakeCount : clickHunt.mistakeCount;
  const examFailFiredRef = useRef(false);
  useEffect(() => {
    if (!isExamMode || !(isClickHunt || isIntervalClickHunt) || examFailFiredRef.current) return;
    if (clickMistakeCount >= CLICK_EXAM_MISTAKE_LIMIT) {
      examFailFiredRef.current = true;
      onExamFail?.();
    }
  }, [isExamMode, isClickHunt, isIntervalClickHunt, clickMistakeCount, onExamFail]);

  const huntGameState = isChordHunt ? chordHunt.gameState : isClickHunt ? clickHunt.gameState : isIntervalClickHunt ? intervalClickHunt.gameState : noteHunt.gameState;
  const huntMaxScore = isChordHunt ? chordHunt.maxPossibleScore : isClickHunt ? clickHunt.maxPossibleScore : isIntervalClickHunt ? intervalClickHunt.maxPossibleScore : noteHunt.maxPossibleScore;
  const huntMaxCombo = isChordHunt ? chordHunt.maxCombo : isClickHunt ? clickHunt.maxCombo : isIntervalClickHunt ? intervalClickHunt.maxCombo : noteHunt.maxCombo;

  // Whole goal solved? Chord: all tones. Click: every valid position. Interval
  // click: both steps of the round. Interval: found the target once.
  // Octave/region/accumulate: every reachable octave. Reported to the rotation
  // hook so it can fast-forward to the next target.
  const huntComplete = isChordHunt
    ? chordHunt.tones.length > 0 && chordHunt.foundTones.length === chordHunt.tones.length
    : isClickHunt
      ? clickHunt.targetPositions.length > 0 && clickHunt.foundKeys.length >= clickHunt.targetPositions.length
      : isIntervalClickHunt
      ? intervalClickHunt.complete
      : isNoteHunt
        ? noteHuntMode === "interval"
          ? noteHunt.foundOctaves.length >= 1
          : noteHunt.octaves.length > 0 && noteHunt.octaves.every(o => noteHunt.foundOctaves.includes(o))
        : false;
  useEffect(() => {
    if (solvedRef) solvedRef.current = huntComplete;
  }, [huntComplete, solvedRef]);

  // Accumulate mode: unlike every other hunt, progress must survive across rotations
  // — each time the CURRENT target is fully solved, bank its pitch class into a
  // running set. Exam accuracy is (distinct notes banked) / 12, not the current
  // target's own found-ratio, so "hit every chromatic note before time runs out"
  // exams score correctly even mid-rotation.
  const [accumulatedNotes, setAccumulatedNotes] = useState<Set<number>>(() => new Set());
  const currentPitchClass = customGoal ? NOTES.indexOf(customGoal) : -1;
  useEffect(() => {
    if (!isAccumulatingHunt || !huntComplete || currentPitchClass < 0) return;
    // Genuine accumulator across renders (history of past targets) — cannot be
    // derived from current props alone, so this isn't the "you might not need
    // an effect" case the rule is built for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAccumulatedNotes(prev => (prev.has(currentPitchClass) ? prev : new Set(prev).add(currentPitchClass)));
  }, [isAccumulatingHunt, huntComplete, currentPitchClass]);
  const accumulatedAccuracy = Math.round((accumulatedNotes.size / 12) * 100);

  const huntAccuracy = isChordHunt ? chordHunt.accuracy : isClickHunt ? clickHunt.accuracy : isIntervalClickHunt ? intervalClickHunt.accuracy : isAccumulatingHunt ? accumulatedAccuracy : noteHunt.accuracy;

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
    if (isClickHunt) {
      const total = clickHunt.targetPositions.length;
      const found = clickHunt.maxCombo;
      return Array.from({ length: total }, (_, i) => (i < found ? "hit" : "miss"));
    }
    if (isIntervalClickHunt) {
      // Two clicks a round, many rounds — so the timeline is the session's clicks
      // themselves (every correct one, then every wrong one) rather than a single
      // prompt's cells, which would say nothing about how the exercise went.
      const found = intervalClickHunt.correctClicks;
      const total = found + intervalClickHunt.mistakeCount;
      return Array.from({ length: total }, (_, i) => (i < found ? "hit" : "miss"));
    }
    if (isNoteHunt) {
      const total = noteHunt.octaves.length;
      const found = noteHunt.maxCombo;
      return Array.from({ length: total }, (_, i) => (i < found ? "hit" : "miss"));
    }
    return tabNoteTimeline;
  }, [
    isChordHunt, chordHunt.tones.length, chordHunt.maxCombo,
    isClickHunt, clickHunt.targetPositions.length, clickHunt.maxCombo,
    isIntervalClickHunt, intervalClickHunt.correctClicks, intervalClickHunt.mistakeCount,
    isNoteHunt, noteHunt.octaves.length, noteHunt.maxCombo,
    tabNoteTimeline,
  ]);

  // Always-current ref so snapshot() never reads stale closure values
  const latestRef = useRef({ score: 0, accuracy: 100, maxCombo: 0, maxPossibleScore: 0, noteTimeline: [] as ("hit" | "miss")[] });
  latestRef.current = { score: gameState.score, accuracy: sessionAccuracy, maxCombo: effectiveMaxCombo, maxPossibleScore: effectiveMaxPossibleScore, noteTimeline };

  const resetGameAndProgress = useCallback(() => {
    resetGame();
    setAccumulatedNotes(new Set());
  }, [resetGame]);

  // Populate the imperative handle on every render — safe, it's just a ref assignment
  handleRef.current = {
    resetGame: resetGameAndProgress,
    snapshot: () => ({ ...latestRef.current }),
  };

  const value = useMemo<NoteMatchingContextValue>(
    () => ({
      hitNotes, missedNotes, currentBeatsElapsedRef, strumSlotFeedback, gameState,
      maxPossibleScore: effectiveMaxPossibleScore, sessionAccuracy,
      noteHunt: isNoteHunt ? noteHunt : null,
      chordHunt: isChordHunt ? chordHunt : null,
      clickHunt: isClickHunt ? clickHunt : null,
      intervalClickHunt: isIntervalClickHunt ? intervalClickHunt : null,
      chromaticProgress: isAccumulatingHunt ? { found: accumulatedNotes.size, total: 12 } : null,
      noteHuntSecondsLeft: isHunt ? noteHuntSecondsLeft : null,
      noteHuntRegion: isNoteHunt && fretRange ? { startFret: fretRange[0], endFret: fretRange[1] } : null,
      noteHuntStrings: isNoteHunt ? (huntStrings ?? null) : null,
      customGoalPrompt: isHunt ? (customGoalPrompt ?? null) : null,
      huntTarget: isHunt ? (customGoal ?? null) : null,
      volumeRef: audioRefs.volumeRef,
      frequencyRef: audioRefs.frequencyRef,
      tuningOffsets,
      advanceHunt: onAdvanceHunt,
      onEnableMic,
      markNoteHuntOctave,
      markChordTone,
      registerFretClick,
      registerIntervalClick,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hitNotes, missedNotes, strumSlotFeedback, gameState, effectiveMaxPossibleScore, sessionAccuracy, isNoteHunt, noteHunt, isChordHunt, chordHunt, isClickHunt, clickHunt, isIntervalClickHunt, intervalClickHunt, registerIntervalClick, isAccumulatingHunt, accumulatedNotes, isHunt, noteHuntSecondsLeft, fretRange, huntStrings, customGoalPrompt, customGoal, tuningOffsets, onAdvanceHunt, onEnableMic, markNoteHuntOctave, markChordTone, registerFretClick],
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
