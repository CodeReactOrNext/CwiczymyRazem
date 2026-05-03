import { createContext, useContext, useMemo, useRef, type MutableRefObject, type ReactNode } from "react";

import type { AudioRefs } from "hooks/useAudioAnalyzer";

import type { StrumPattern, TablatureMeasure } from "../../../types/exercise.types";
import type { GameState } from "../hooks/noteMatchingFeedback";
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
  isHalfSpeed: boolean;
  getLatencyMs: () => number;
  audioRefs: AudioRefs;
  getAdjustedTargetFreq: (string: number, baseFreq: number) => number;
  // inputs for useStrummingMatcher
  activeStrumPattern: StrumPattern | undefined;
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
  isHalfSpeed,
  getLatencyMs,
  audioRefs,
  getAdjustedTargetFreq,
  activeStrumPattern,
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
    isHalfSpeed,
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

  const isStrummingExercise = !!activeStrumPattern;
  const gameState = isStrummingExercise ? strumGameState : tabGameState;
  const sessionAccuracy = isStrummingExercise ? strumAccuracy : tabAccuracy;

  // noteTimeline is only needed for the end-of-session snapshot
  const noteTimeline = useMemo((): ("hit" | "miss")[] => {
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

  // Always-current ref so snapshot() never reads stale closure values
  const latestRef = useRef({ score: 0, accuracy: 100, maxCombo: 0, maxPossibleScore: 0, noteTimeline: [] as ("hit" | "miss")[] });
  latestRef.current = { score: gameState.score, accuracy: sessionAccuracy, maxCombo, maxPossibleScore, noteTimeline };

  // Populate the imperative handle on every render — safe, it's just a ref assignment
  handleRef.current = {
    resetGame,
    snapshot: () => ({ ...latestRef.current }),
  };

  const value = useMemo<NoteMatchingContextValue>(
    () => ({ hitNotes, missedNotes, currentBeatsElapsedRef, strumSlotFeedback, gameState, maxPossibleScore, sessionAccuracy }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hitNotes, missedNotes, strumSlotFeedback, gameState, maxPossibleScore, sessionAccuracy],
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
