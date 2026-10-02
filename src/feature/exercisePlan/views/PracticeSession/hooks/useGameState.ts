import { startTransition, useCallback, useEffect, useRef, useState } from "react";

import type { NoteTiming, TimingCounts } from "../utils/timingGrade";
import { emptyTimingCounts } from "../utils/timingGrade";
import type { GameState } from "./noteMatchingFeedback";

const INITIAL_GS: GameState = { score: 0, combo: 0, multiplier: 1 };

export function useGameState(currentExerciseIndex: number, onReset?: () => void) {
  const [hitNotes,        setHitNotes]        = useState<Record<string, boolean | number>>({});
  const [missedNotes,     setMissedNotes]     = useState<Record<string, boolean>>({});
  const [sessionAccuracy, setSessionAccuracy] = useState(100);
  const [sessionStats,    setSessionStats]    = useState({ hits: 0, misses: 0 });
  const [maxCombo,        setMaxCombo]        = useState(0);
  const [gameState,       setGameState]       = useState<GameState>(INITIAL_GS);
  const [noteTimings,     setNoteTimings]     = useState<Record<string, NoteTiming>>({});

  // Mutable refs for direct mutation inside the RAF loop (zero re-render overhead)
  const hitNotesRef          = useRef<Record<string, boolean | number>>({});
  const missedNotesRef       = useRef<Record<string, boolean>>({});
  const gameStateRef         = useRef<GameState>({ ...INITIAL_GS });
  const statsRef             = useRef({ hits: 0, misses: 0 });
  const maxComboRef          = useRef(0);
  const lastFlushRef         = useRef(0);
  const needsFlushRef        = useRef(false);
  /** Slowest tempo a note was scored at this run — the tempo the run is
   *  stamped with, so speeding up at the end cannot claim the faster BPM. */
  const minScoredBpmRef      = useRef<number | null>(null);
  /** noteKey -> timing of its latest hit. Unlike hitNotes it survives a
   *  loop wrap: the frozen tail of the finished pass still paints its grades,
   *  and a note hit again in the new pass simply overwrites its own. */
  const noteTimingsRef       = useRef<Record<string, NoteTiming>>({});
  /** Hits per timing grade over the whole run, loops included — like the score. */
  const timingCountsRef      = useRef<TimingCounts>(emptyTimingCounts());

  const reset = useCallback(() => {
    setHitNotes({});    hitNotesRef.current          = {};
    setMissedNotes({}); missedNotesRef.current       = {};
    setSessionAccuracy(100);
    setSessionStats({ hits: 0, misses: 0 });
    setMaxCombo(0);
    setGameState({ ...INITIAL_GS }); gameStateRef.current = { ...INITIAL_GS };
    statsRef.current             = { hits: 0, misses: 0 };
    maxComboRef.current          = 0;
    needsFlushRef.current        = false;
    minScoredBpmRef.current      = null;
    setNoteTimings({}); noteTimingsRef.current = {};
    timingCountsRef.current      = emptyTimingCounts();
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
      setNoteTimings({ ...noteTimingsRef.current });
      setMissedNotes({ ...missedNotesRef.current });
      setSessionStats({ hits: s.hits, misses: s.misses });
      setSessionAccuracy(total > 0 ? Math.round((s.hits / total) * 100) : 100);
      setGameState({ ...gs });
      setMaxCombo(maxComboRef.current);
    });
  }, []);

  return {
    hitNotes, missedNotes, sessionAccuracy, sessionStats, maxCombo, gameState, noteTimings,
    hitNotesRef, missedNotesRef, gameStateRef, statsRef,
    maxComboRef, needsFlushRef, minScoredBpmRef,
    noteTimingsRef, timingCountsRef,
    flushToReact, reset,
  };
}
