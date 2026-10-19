import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

import type { BossFightSessionControls } from "../contexts/BossFightControlsContext";
import type { TabOverlayValue } from "../contexts/TabOverlayContext";

interface UseBossFightSessionOptions {
  /** The session is a boss fight at all. */
  isActive: boolean;
  /** Laid over the tab — the fight's web. */
  tabOverlay: ReactNode;
  /** The fight is decided. */
  isOver: boolean;
  /** The fight holds the run (the boss changing phase). */
  isHolding: boolean;
  /** Deals a fresh fight. */
  onNewRun: (() => void) | undefined;
  stopTimer: () => void;
  stopMetronome: () => void;
  handleRestart: () => void;
  hasLoggedPractice: boolean;
  /** Reports the session's practice time — nothing from the run. */
  reportPracticeTime: () => void;
  onClose: () => void;
  isFinishing: boolean;
}

/**
 * Long enough for a new fight's first tempo to have reached the metronome, so
 * the restart counts in at it rather than at the tempo the last run ended on.
 */
const NEW_RUN_RESTART_DELAY_MS = 60;

/**
 * The session's side of a boss fight: freezes the run once the fight is
 * decided or between phases, and hands the fight's overlay the controls it may
 * use. A plain restart of the run (R, the restart button) only starts the tab
 * over — the fight goes on.
 */
export function useBossFightSession({
  isActive,
  tabOverlay,
  isOver,
  isHolding,
  onNewRun,
  stopTimer,
  stopMetronome,
  handleRestart,
  hasLoggedPractice,
  reportPracticeTime,
  onClose,
  isFinishing,
}: UseBossFightSessionOptions): { controls: BossFightSessionControls; tabOverlay: TabOverlayValue } {
  const isFrozen = isOver || isHolding;
  useEffect(() => {
    if (!isFrozen) return;
    stopTimer();
    stopMetronome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFrozen]);

  // Read after a re-render, so a restart counts in at the session's newest tempo.
  const handleRestartRef = useRef(handleRestart);
  const onNewRunRef = useRef(onNewRun);
  useLayoutEffect(() => {
    handleRestartRef.current = handleRestart;
    onNewRunRef.current = onNewRun;
  });

  // A fight shows its own score in the arena: the session's HUD over the tab
  // would only say it twice.
  const tabOverlayValue = useMemo(
    () => ({ overlay: tabOverlay ?? null, gameMode: isActive }),
    [tabOverlay, isActive],
  );

  const controls = useMemo(
    () => ({
      restart: () => {
        onNewRunRef.current?.();
        window.setTimeout(() => handleRestartRef.current(), NEW_RUN_RESTART_DELAY_MS);
      },
      resume: handleRestart,
      finish: () => {
        stopMetronome();
        if (hasLoggedPractice) reportPracticeTime();
        else onClose();
      },
      isFinishing,
    }),
    [handleRestart, stopMetronome, hasLoggedPractice, reportPracticeTime, onClose, isFinishing],
  );

  return { controls, tabOverlay: tabOverlayValue };
}
