import { startTransition, useCallback, useEffect, useRef, useState } from "react";

import { sameMarks } from "../components/noteMarkPatch";
import type { NoteTiming, RunNote, TimingCounts } from "../utils/timingGrade";
import { emptyTimingCounts } from "../utils/timingGrade";
import type { TimedHits } from "../utils/timingPrecision";
import { emptyTimedHits } from "../utils/timingPrecision";
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
  /** Signed attack offsets (ms, + = late) of every timed hit this run, loops
   *  included — what the run's timing precision is read from. */
  const timingOffsetsRef     = useRef<number[]>([]);
  /** Of the hits whose attack was timed, how many were on time — see onTimePercent. */
  const timedHitsRef         = useRef<TimedHits>(emptyTimedHits());
  /** Pitch-graded notes per intonation grade over the run (pitch-focused exercises). */
  const intonationCountsRef  = useRef<TimingCounts>(emptyTimingCounts());
  /** Signed cents (+ = sharp) of every pitch-graded note that came near its pitch. */
  const intonationOffsetsRef = useRef<number[]>([]);
  /** Every graded note of the run, in order — see RunNote. */
  const runLogRef            = useRef<RunNote[]>([]);
  /** The maps React holds, as last flushed — a flush hands over only the ones
   *  that differ, so a hit doesn't re-send the misses nor a miss the hits. */
  const flushedRef           = useRef<{
    hits: Record<string, boolean | number>;
    missed: Record<string, boolean>;
    timings: Record<string, NoteTiming>;
  }>({ hits: {}, missed: {}, timings: {} });

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
    timingOffsetsRef.current     = [];
    timedHitsRef.current         = emptyTimedHits();
    intonationCountsRef.current  = emptyTimingCounts();
    intonationOffsetsRef.current = [];
    runLogRef.current            = [];
    flushedRef.current           = { hits: {}, missed: {}, timings: {} };
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
    // Each map goes to React (and from there to the tab's worker) only when it
    // changed: every copy is a new identity, and a new identity re-renders and
    // re-sends whatever reads it.
    const flushed = flushedRef.current;
    const hits    = sameMarks(flushed.hits, hitNotesRef.current) ? null : { ...hitNotesRef.current };
    const timings = sameMarks(flushed.timings, noteTimingsRef.current) ? null : { ...noteTimingsRef.current };
    const missed  = sameMarks(flushed.missed, missedNotesRef.current) ? null : { ...missedNotesRef.current };
    if (hits) flushed.hits = hits;
    if (timings) flushed.timings = timings;
    if (missed) flushed.missed = missed;
    const score = gs.score, combo = gs.combo, multiplier = gs.multiplier;
    const hitCount = s.hits, missCount = s.misses;
    startTransition(() => {
      if (hits) setHitNotes(hits);
      if (timings) setNoteTimings(timings);
      if (missed) setMissedNotes(missed);
      setSessionStats(prev => (prev.hits === hitCount && prev.misses === missCount ? prev : { hits: hitCount, misses: missCount }));
      setSessionAccuracy(total > 0 ? Math.round((hitCount / total) * 100) : 100);
      setGameState(prev => (prev.score === score && prev.combo === combo && prev.multiplier === multiplier ? prev : { score, combo, multiplier }));
      setMaxCombo(maxComboRef.current);
    });
  }, []);

  return {
    hitNotes, missedNotes, sessionAccuracy, sessionStats, maxCombo, gameState, noteTimings,
    hitNotesRef, missedNotesRef, gameStateRef, statsRef,
    maxComboRef, needsFlushRef, minScoredBpmRef,
    noteTimingsRef, timingCountsRef, timingOffsetsRef, timedHitsRef, intonationCountsRef, intonationOffsetsRef, runLogRef,
    flushToReact, reset,
  };
}
