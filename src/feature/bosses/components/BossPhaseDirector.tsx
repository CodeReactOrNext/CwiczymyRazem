import { useBossFightControls } from "feature/exercisePlan/views/PracticeSession/contexts/BossFightControlsContext";
import { useEffect, useRef } from "react";

import { useBossFightStore } from "../store/bossFightStore";

/** How long the phase intro plays — the molt — before the draft is dealt. */
export const MOLT_MS = 2400;
/** A beat after the pick for the new form to land before the count-in. */
export const RESUME_AFTER_PICK_MS = 900;

/**
 * Runs the break between phases: the boss molts behind the phase intro, the
 * draft is dealt and the run stays held until a boon is taken, then the next
 * phase counts in at its tempo.
 */
export const BossPhaseDirector = () => {
  const controls = useBossFightControls();
  const holding = useBossFightStore((s) => s.fight.holding);
  const phaseTick = useBossFightStore((s) => s.fight.phaseTick);
  const hasDraft = useBossFightStore((s) => s.fight.draft !== null);
  const draftOpen = useBossFightStore((s) => s.draftOpen);

  // Read when the break ends, not when it starts: by then the session has
  // re-rendered at the new tempo, and only its newest controls count in at it.
  const controlsRef = useRef(controls);
  useEffect(() => {
    controlsRef.current = controls;
  }, [controls]);

  useEffect(() => {
    if (!holding || (hasDraft && draftOpen)) return undefined;
    const timer = window.setTimeout(
      () => {
        const store = useBossFightStore.getState();
        if (hasDraft) {
          store.setDraftOpen(true);
          return;
        }
        store.endPhaseBreak();
        controlsRef.current.resume();
      },
      hasDraft ? MOLT_MS : RESUME_AFTER_PICK_MS,
    );
    return () => window.clearTimeout(timer);
  }, [holding, phaseTick, hasDraft, draftOpen]);

  return null;
};
