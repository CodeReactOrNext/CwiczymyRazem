import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Visits that still get the "this is clickable" nudge on the first motivatable row of the feed.
 * The button is easy to read as a passive Fame badge, so it needs an active cue — but only for as
 * long as it takes to learn it, hence the cap.
 */
const MAX_HINT_SESSIONS = 5;

interface MotivateHintState {
  /** The user has motivated someone at least once, so the button no longer needs explaining. */
  hasMotivated: boolean;
  /** Visits during which the nudge was shown. */
  sessionsShown: number;
  markMotivated: () => void;
  registerSession: () => void;
}

const useMotivateHintStore = create<MotivateHintState>()(
  persist(
    (set, get) => ({
      hasMotivated: false,
      sessionsShown: 0,
      markMotivated: () => {
        if (get().hasMotivated) return;
        set({ hasMotivated: true });
      },
      registerSession: () => set({ sessionsShown: get().sessionsShown + 1 }),
    }),
    {
      name: "motivate-hint",
      version: 1,
      partialize: ({ hasMotivated, sessionsShown }) => ({
        hasMotivated,
        sessionsShown,
      }),
    },
  ),
);

/**
 * Whether this visit spent one of its nudges. Kept per page load rather than per component: the
 * feed mounts more than once per visit (the desktop and mobile views live side by side), and the
 * allowance is meant to count visits, not mounts.
 */
let hasClaimedVisit = false;

const claimVisit = () => {
  if (hasClaimedVisit) return;

  const state = useMotivateHintStore.getState();
  if (state.hasMotivated || state.sessionsShown >= MAX_HINT_SESSIONS) return;

  hasClaimedVisit = true;
  // Bumping the counter also notifies subscribers, which is what brings the nudge on screen.
  state.registerSession();
};

const getHintSnapshot = () =>
  hasClaimedVisit && !useMotivateHintStore.getState().hasMotivated;

/** The nudge is a client-only decision — the server has no idea what this user already knows. */
const getServerHintSnapshot = () => false;

/** Retires the nudge for good — the user has motivated someone, so they know what the button does. */
export const markMotivateHintDone = () =>
  useMotivateHintStore.getState().markMotivated();

/**
 * Whether the feed should still point at its Motivate button. Decided once per visit, so a session
 * that spends the last of the allowance keeps the nudge until it ends instead of losing it
 * mid-scroll.
 */
export const useMotivateHint = (): boolean => {
  const shouldHint = useSyncExternalStore(
    useMotivateHintStore.subscribe,
    getHintSnapshot,
    getServerHintSnapshot,
  );

  useEffect(() => {
    claimVisit();
  }, []);

  return shouldHint;
};
