import { useEffect } from "react";
import { create } from "zustand";

interface EarQuizVerdictState {
  /** A listening round is answered and its verdict is up. */
  isShown: boolean;
  setShown: (isShown: boolean) => void;
}

/**
 * Whether a round's verdict is up, kept outside the panel: the session holds its
 * clock, and leaves Space to Continue, while there is one to read.
 */
export const useEarQuizVerdictStore = create<EarQuizVerdictState>()((set) => ({
  isShown: false,
  setShown: (isShown) => set({ isShown }),
}));

/** Tells the session about a settled round, until the round or the panel goes. */
export function useEarQuizVerdictShown(isSettled: boolean) {
  useEffect(() => {
    if (!isSettled) return undefined;
    const { setShown } = useEarQuizVerdictStore.getState();
    setShown(true);
    return () => setShown(false);
  }, [isSettled]);
}
