import { holdSessionEntry, releaseSessionEntry, setSessionEntrySteps } from "feature/sessionEntry/sessionEntryStore";
import { useEffect, useId } from "react";

import type { LoadingStep } from "./SessionLoadingSteps";

interface PracticeLoadingScreenProps {
  /** When true, this screen no longer keeps the session covered. */
  isReady: boolean;
  /** What is still being loaded, shown under the strings while it waits. */
  steps?: readonly LoadingStep[];
}

const NO_STEPS: readonly LoadingStep[] = [];

/**
 * Keeps the cut into the session (feature/sessionEntry) on screen while
 * something is still loading. It draws nothing itself: the cut is one overlay
 * in _app that started when the player pressed the button, so a page's loader
 * handing over to the session's doesn't restart it.
 *
 * Mounted ready, it still plays the cut once — a session always opens with it.
 */
export const PracticeLoadingScreen = ({ isReady, steps = NO_STEPS }: PracticeLoadingScreenProps) => {
  const id = useId();

  useEffect(() => {
    holdSessionEntry(id);
    return () => releaseSessionEntry(id);
  }, [id]);

  // Lets go once and for good: loading something later in the session (the
  // next exercise's file) doesn't bring the cut back.
  useEffect(() => {
    if (isReady) releaseSessionEntry(id);
  }, [id, isReady]);

  useEffect(() => {
    setSessionEntrySteps(steps);
  }, [steps]);

  return null;
};
