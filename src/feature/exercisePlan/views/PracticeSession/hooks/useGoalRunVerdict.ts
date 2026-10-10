import type { ReactNode, RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { NoteMatchingHandle } from "../contexts/NoteMatchingContext";
import type { GoalRunConfig } from "../PracticeSession";

interface UseGoalRunVerdictOptions {
  goalRun: GoalRunConfig | undefined;
  /** True once the run has been played to the end and the summary is up. */
  showSuccessView: boolean;
  isMicEnabled: boolean;
  noteMatchingHandle: RefObject<NoteMatchingHandle | null>;
}

/**
 * Goal mode: judges each run played to the end exactly once, the moment the
 * summary opens, and holds what the summary shows about the goal. `rearm` is
 * for "Try again" — the next run gets judged on its own.
 */
export function useGoalRunVerdict({
  goalRun,
  showSuccessView,
  isMicEnabled,
  noteMatchingHandle,
}: UseGoalRunVerdictOptions) {
  const judgedRef = useRef(false);
  const [verdict, setVerdict] = useState<ReactNode>(null);

  useEffect(() => {
    if (!showSuccessView || !goalRun || judgedRef.current) return;
    judgedRef.current = true;
    const snap = noteMatchingHandle.current?.snapshot();
    // No mic, or not a note landed: nothing was played at a tempo we can name.
    const minScoredBpm = isMicEnabled ? snap?.minScoredBpm : null;
    goalRun
      .onRunComplete({
        bpm: minScoredBpm ? Math.round(minScoredBpm) : null,
        accuracy: snap?.accuracy ?? 0,
        timing: isMicEnabled ? (snap?.timingPrecision ?? null) : null,
      })
      .then(setVerdict)
      .catch(() => setVerdict(null));
    // Fires once per run reaching its end, not on every identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSuccessView]);

  const rearm = useCallback(() => {
    judgedRef.current = false;
    setVerdict(null);
  }, []);

  return {
    verdict: goalRun ? (verdict ?? goalRun.pendingContent ?? null) : undefined,
    rearm,
  };
}
