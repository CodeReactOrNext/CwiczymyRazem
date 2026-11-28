import { useEffect, useState } from "react";
import { create } from "zustand";

interface StageModeStore {
  /** The player asked for the stage. Whether it is on screen is the session view's call. */
  on: boolean;
  setOn: (on: boolean) => void;
}

/**
 * Stage mode: the session drops everything but the tab and the score and puts
 * them in a room. Desktop only — the phone session has its own full screen.
 * Not persisted: every session opens the ordinary way.
 */
export const useStageModeStore = create<StageModeStore>((set) => ({
  on: false,
  setOn: (on) => set({ on }),
}));

/** The stage tab is cut to the screen's width, not to the page: a share of it. */
const TAB_HEIGHT_SHARE = 0.2;
export const STAGE_TAB_MIN_PX = 220;
export const STAGE_TAB_MAX_PX = 440;

export const stageTabHeight = (windowWidth: number) =>
  Math.round(Math.min(STAGE_TAB_MAX_PX, Math.max(STAGE_TAB_MIN_PX, windowWidth * TAB_HEIGHT_SHARE)));

/** Height of the board on the stage; follows the window. */
export function useStageTabHeight(enabled: boolean): number {
  const [height, setHeight] = useState(() =>
    typeof window === "undefined" ? STAGE_TAB_MIN_PX : stageTabHeight(window.innerWidth),
  );
  useEffect(() => {
    if (!enabled) return undefined;
    const measure = () => setHeight(stageTabHeight(window.innerWidth));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [enabled]);
  return height;
}

