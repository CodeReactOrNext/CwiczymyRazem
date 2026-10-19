import type { ReactNode } from "react";
import { createContext, useContext } from "react";

export interface TabOverlayValue {
  /** Laid over the tab itself — a boss fight's web. Display only. */
  overlay: ReactNode;
  /**
   * A game mode owns the screen: it shows its own score and identity, so the
   * session's score HUD and the exercise's details (difficulty, reward)
   * step aside.
   */
  gameMode: boolean;
}

const TabOverlayContext = createContext<TabOverlayValue>({ overlay: null, gameMode: false });

/**
 * What a game mode puts on (or takes off) the tab. Provided once by
 * PracticeSession and read by whichever tab view is on screen — the desktop
 * and phone views are both mounted.
 */
export const TabOverlayProvider = TabOverlayContext.Provider;

export const useTabOverlay = () => useContext(TabOverlayContext);
