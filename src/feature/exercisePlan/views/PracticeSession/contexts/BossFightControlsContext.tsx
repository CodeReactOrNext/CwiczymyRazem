import { createContext, useContext } from "react";

/** What a boss fight may do to the session it runs in. */
export interface BossFightSessionControls {
  /** A new fight from the top: the fight is dealt afresh, then the run
   *  restarts at its tempo, count-in included. */
  restart: () => void;
  /** The tab from the top with a count-in, the fight carrying on — the
   *  boss's next phase, at the tempo the session now has. */
  resume: () => void;
  /** Reports the practice time and opens the session summary; with nothing
   *  worth reporting yet (under the 20 s floor) it just leaves. */
  finish: () => void;
  isFinishing: boolean;
}

const BossFightControlsContext = createContext<BossFightSessionControls | null>(null);

export const BossFightControlsProvider = BossFightControlsContext.Provider;

/** The session's controls, for the fight's overlay (BossFightConfig.overlay). */
export const useBossFightControls = (): BossFightSessionControls => {
  const controls = useContext(BossFightControlsContext);
  if (!controls) throw new Error("useBossFightControls outside a boss fight session");
  return controls;
};
