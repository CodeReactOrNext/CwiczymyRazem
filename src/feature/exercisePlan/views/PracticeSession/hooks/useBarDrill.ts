import { useCallback, useRef, useState } from "react";

import type { TablatureMeasure } from "../../../types/exercise.types";
import { createBarPassCounter, DRILL_PASSES } from "../utils/barPasses";
import { gradedNoteCount } from "../utils/muteStrum";
import type { NoteJudgement } from "./useNoteMatching";

interface BarDrill {
  /** The exercise the drill belongs to — it never outlives a move to another. */
  exerciseId: string;
  /** Index of the bar in the exercise's tab. */
  measure: number;
  /** The tab while the drill is on: that one bar, looping. */
  tablature: TablatureMeasure[];
  passes: number;
}

/**
 * One bar of the exercise, looped on its own at a slower tempo until it has
 * been played clean DRILL_PASSES times. It only keeps count — the session
 * swaps the tab, the tempo and the bar at the bottom while it is on.
 */
export function useBarDrill(exerciseId: string) {
  const [drill, setDrill] = useState<BarDrill | null>(null);
  const counterRef = useRef<ReturnType<typeof createBarPassCounter> | null>(null);

  // Moving on ends it (adjusting state while rendering, see the React docs).
  if (drill && drill.exerciseId !== exerciseId) setDrill(null);
  const current = drill?.exerciseId === exerciseId ? drill : null;

  const start = useCallback((measure: number, bar: TablatureMeasure) => {
    counterRef.current = createBarPassCounter(
      bar.beats.reduce((sum, beat) => sum + gradedNoteCount(beat.notes), 0),
    );
    setDrill({ exerciseId, measure, tablature: [bar], passes: 0 });
  }, [exerciseId]);

  const stop = useCallback(() => setDrill(null), []);

  const handleNoteJudged = useCallback(({ noteKey, hit }: NoteJudgement) => {
    const passes = Math.min(DRILL_PASSES, counterRef.current?.judge(noteKey, hit) ?? 0);
    setDrill((now) => (now && now.passes !== passes ? { ...now, passes } : now));
  }, []);

  return {
    drill: current,
    isDone: !!current && current.passes >= DRILL_PASSES,
    start,
    stop,
    handleNoteJudged,
  };
}
