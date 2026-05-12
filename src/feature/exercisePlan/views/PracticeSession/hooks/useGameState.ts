import { startTransition, useCallback, useEffect, useRef, useState } from "react";

import type { GameState } from "./noteMatchingFeedback";

const INITIAL_GS: GameState = { score: 0, combo: 0, multiplier: 1, lastFeedback: "", feedbackId: 0 };

export function useGameState(currentExerciseIndex: number, onReset?: () => void) {
  const [hitNotes,        setHitNotes]        = useState<Record<string, boolean | number>>({});
  const [missedNotes,     setMissedNotes]     = useState<Record<string, boolean>>({});
  const [sessionAccuracy, setSessionAccuracy] = useState(100);
  const [sessionStats,    setSessionStats]    = useState({ hits: 0, misses: 0 });
  const [maxCombo,        setMaxCombo]        = useState(0);
  const [gameState,       setGameState]       = useState<GameState>(INITIAL_GS);

  // Mutable refs for direct mutation inside the RAF loop (zero re-render overhead)
  const hitNotesRef          = useRef<Record<string, boolean | number>>({});
  const missedNotesRef       = useRef<Record<string, boolean>>({});
  const gameStateRef         = useRef<GameState>({ ...INITIAL_GS });
  const statsRef             = useRef({ hits: 0, misses: 0 });
  const maxComboRef          = useRef(0);
  const consecutiveMissesRef = useRef(0);
  const lastFlushRef         = useRef(0);
  const needsFlushRef        = useRef(false);

  useEffect(() => {
    if (!gameState.lastFeedback) return;
    const t = setTimeout(() => setGameState(prev => ({ ...prev, lastFeedback: "" })), 1500);
    return () => clearTimeout(t);
  }, [gameState.feedbackId]);

  const reset = useCallback(() => {
    setHitNotes({});    hitNotesRef.current          = {};
    setMissedNotes({}); missedNotesRef.current       = {};
    setSessionAccuracy(100);
    setSessionStats({ hits: 0, misses: 0 });
    setMaxCombo(0);
    setGameState({ ...INITIAL_GS }); gameStateRef.current = { ...INITIAL_GS };
    statsRef.current             = { hits: 0, misses: 0 };
    maxComboRef.current          = 0;
    consecutiveMissesRef.current = 0;
    needsFlushRef.current        = false;
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reset(); onReset?.(); }, [currentExerciseIndex]);

  // Throttled flush: immediate after a long pause (>200ms), 50ms throttle during active play
  const flushToReact = useCallback(() => {
    const now            = Date.now();
    const timeSinceFlush = now - lastFlushRef.current;
    if (!needsFlushRef.current || timeSinceFlush < (timeSinceFlush > 200 ? 0 : 50)) return;
    lastFlushRef.current  = now;
    needsFlushRef.current = false;
    const gs    = gameStateRef.current;
    const s     = statsRef.current;
    const total = s.hits + s.misses;
    startTransition(() => {
      setHitNotes({ ...hitNotesRef.current });
      setMissedNotes({ ...missedNotesRef.current });
      setSessionStats({ hits: s.hits, misses: s.misses });
      setSessionAccuracy(total > 0 ? Math.round((s.hits / total) * 100) : 100);
      setGameState({ ...gs });
      setMaxCombo(maxComboRef.current);
    });
  }, []);

  return {
    hitNotes, missedNotes, sessionAccuracy, sessionStats, maxCombo, gameState,
    hitNotesRef, missedNotesRef, gameStateRef, statsRef,
    maxComboRef, consecutiveMissesRef, needsFlushRef,
    flushToReact, reset,
  };
}
