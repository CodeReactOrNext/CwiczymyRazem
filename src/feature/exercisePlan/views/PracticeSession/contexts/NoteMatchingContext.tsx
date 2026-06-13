import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { createContext, type MutableRefObject, type ReactNode,useContext, useMemo, useRef } from "react";

import type { StrumPattern, TablatureMeasure } from "../../../types/exercise.types";
import type { GameState } from "../hooks/noteMatchingFeedback";
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
  /** Live note-hunt state — populated only for customGoal exercises. */
  noteHunt: NoteHuntState | null;
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

const NoteMatchingContext = createContext<NoteMatchingContextValue>({
  hitNotes: {},
  missedNotes: {},
  currentBeatsElapsedRef: _fallbackRef,
  strumSlotFeedback: undefined,
  gameState: defaultGameState,
  maxPossibleScore: 0,
  sessionAccuracy: 100,
  noteHunt: null,
});

// ── Provider ──────────────────────────────────────────────────────────────────

interface NoteMatchingProviderProps {
  children: ReactNode;
  handleRef: React.MutableRefObject<NoteMatchingHandle | null>;
  // inputs for useNoteMatching
  isPlaying: boolean;
  startTime: number | null;
  effectiveBpm: number;
  rawBpm: number;
  activeTablature: TablatureMeasure[] | null | undefined;
  isMicEnabled: boolean;
  currentExerciseIndex: number;
  speedMultiplier: number;
  getLatencyMs: () => number;
  audioRefs: AudioRefs;
  getAdjustedTargetFreq: (string: number, baseFreq: number) => number;
  // inputs for useStrummingMatcher
  activeStrumPattern: StrumPattern | undefined;
  // input for useNoteHunt (customGoal exercises)
  customGoal: string | undefined;
  // callback
  onReset: () => void;
}

export function NoteMatchingProvider({
  children,
  handleRef,
  isPlaying,
  startTime,
  effectiveBpm,
  rawBpm,
  activeTablature,
  isMicEnabled,
  currentExerciseIndex,
  speedMultiplier,
  getLatencyMs,
  audioRefs,
  getAdjustedTargetFreq,
  activeStrumPattern,
  customGoal,
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
    effectiveBpm,
    rawBpm,
    activeTablature,
    isMicEnabled,
    currentExerciseIndex,
    speedMultiplier,
    getLatencyMs,
    audioRefs,
    getAdjustedTargetFreq,
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

  const isNoteHunt = !!customGoal;
  const noteHunt = useNoteHunt(
    customGoal ?? "",
    audioRefs.frequencyRef,
    audioRefs.volumeRef,
    isMicEnabled && isNoteHunt,
  );

  const isStrummingExercise = !!activeStrumPattern;
  const gameState = isNoteHunt ? noteHunt.gameState : isStrummingExercise ? strumGameState : tabGameState;
  const sessionAccuracy = isNoteHunt ? noteHunt.accuracy : isStrummingExercise ? strumAccuracy : tabAccuracy;
  const effectiveMaxPossibleScore = isNoteHunt ? noteHunt.maxPossibleScore : maxPossibleScore;
  const effectiveMaxCombo = isNoteHunt ? noteHunt.maxCombo : maxCombo;

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

  // For the note hunt, the timeline is one "hit" per octave found plus a "miss"
  // for each octave still missing — so the success screen shows real progress.
  const noteTimeline = useMemo((): ("hit" | "miss")[] => {
    if (!isNoteHunt) return tabNoteTimeline;
    const total = noteHunt.octaves.length;
    const found = noteHunt.maxCombo;
    return Array.from({ length: total }, (_, i) => (i < found ? "hit" : "miss"));
  }, [isNoteHunt, noteHunt.octaves.length, noteHunt.maxCombo, tabNoteTimeline]);

  // Always-current ref so snapshot() never reads stale closure values
  const latestRef = useRef({ score: 0, accuracy: 100, maxCombo: 0, maxPossibleScore: 0, noteTimeline: [] as ("hit" | "miss")[] });
  latestRef.current = { score: gameState.score, accuracy: sessionAccuracy, maxCombo: effectiveMaxCombo, maxPossibleScore: effectiveMaxPossibleScore, noteTimeline };

  // Populate the imperative handle on every render — safe, it's just a ref assignment
  handleRef.current = {
    resetGame,
    snapshot: () => ({ ...latestRef.current }),
  };

  const value = useMemo<NoteMatchingContextValue>(
    () => ({ hitNotes, missedNotes, currentBeatsElapsedRef, strumSlotFeedback, gameState, maxPossibleScore: effectiveMaxPossibleScore, sessionAccuracy, noteHunt: isNoteHunt ? noteHunt : null }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hitNotes, missedNotes, strumSlotFeedback, gameState, effectiveMaxPossibleScore, sessionAccuracy, isNoteHunt, noteHunt],
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
