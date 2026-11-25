import type { LoadingStep } from "feature/exercisePlan/views/PracticeSession/components/SessionLoadingSteps";
import { create } from "zustand";

/**
 * The cut into a practice session: bands wipe in from the right, Kostek strikes
 * the strings, and everything leaves to the left with the session behind it.
 *
 * `in` covers the screen and stays for as long as something still loads;
 * `out` is the wipe that reveals the session.
 */
type SessionEntryPhase = "idle" | "in" | "out";

interface SessionEntryState {
  phase: SessionEntryPhase;
  /** Covered from the first frame, without the wipe: a session opened by its
   *  address has no page to wipe away. */
  instant: boolean;
  /** Counts the runs, so each one starts its animations from the top. */
  run: number;
  /** What is still loading, shown under the strings on a long wait. */
  steps: readonly LoadingStep[];
}

/** The strike has to land before the wipe out: from the scene's first frame. */
export const MIN_SCENE_MS = 1400;
const MIN_SCENE_INSTANT_MS = 1200;
/** The bands have covered the page by now (their slide + stagger, see the
 *  stylesheet): what is under them can be swapped without it showing. */
export const COVER_MS = 340;
/** How long a cover keeps holding after it handed over: the session it let in
 *  is heavy to mount, and its own loader takes over within this. */
const COVER_HANDOVER_MS = 600;
/** One screen's loader hands over to the next within a commit or two. */
export const HANDOVER_MS = 120;
/** How long the wipe out takes (bands + their stagger, see the stylesheet). */
export const OUT_MS = 700;
/** The scene is a separate chunk; if it never arrives, don't wait for it. */
export const SCENE_WAIT_MS = 2500;
/** The way in opens after this even if something never finished loading — a
 *  file the player can't read mustn't lock the session behind it. */
export const MAX_WAIT_MS = 45_000;

const INITIAL: SessionEntryState = { phase: "idle", instant: false, run: 0, steps: [] };

export const useSessionEntryStore = create<SessionEntryState>(() => INITIAL);

const holds = new Set<string>();
let navigating = false;
let startedAt = 0;
let sceneAt: number | null = null;
let releaseTimer: ReturnType<typeof setTimeout> | undefined;
let outTimer: ReturnType<typeof setTimeout> | undefined;
let giveUpTimer: ReturnType<typeof setTimeout> | undefined;

const { getState, setState } = useSessionEntryStore;

const leave = () => {
  clearTimeout(releaseTimer);
  clearTimeout(giveUpTimer);
  clearTimeout(outTimer);
  setState({ phase: "out" });
  outTimer = setTimeout(() => setState({ phase: "idle", steps: [] }), OUT_MS);
};

const tryRelease = () => {
  clearTimeout(releaseTimer);
  if (getState().phase !== "in" || navigating || holds.size > 0) return;
  const now = Date.now();
  let wait = 0;
  if (sceneAt === null) {
    if (now - startedAt < SCENE_WAIT_MS) wait = 100;
  } else {
    const min = getState().instant ? MIN_SCENE_INSTANT_MS : MIN_SCENE_MS;
    wait = Math.max(0, min - (now - sceneAt));
  }
  if (wait > 0) {
    releaseTimer = setTimeout(tryRelease, wait);
    return;
  }
  leave();
};

/** Nothing leaves at once: the next loader may be a commit away. */
const scheduleRelease = () => {
  clearTimeout(releaseTimer);
  releaseTimer = setTimeout(tryRelease, HANDOVER_MS);
};

const enter = (instant: boolean) => {
  clearTimeout(outTimer);
  clearTimeout(releaseTimer);
  clearTimeout(giveUpTimer);
  startedAt = Date.now();
  sceneAt = null;
  setState((s) => ({ phase: "in", instant, run: s.run + 1, steps: [] }));
  giveUpTimer = setTimeout(() => {
    holds.clear();
    navigating = false;
    leave();
  }, MAX_WAIT_MS);
};

/** The player pressed something that leads into a session: wipe in over the
 *  page they are on, while the next one loads. */
export const beginSessionEntry = () => {
  navigating = true;
  if (getState().phase !== "in") enter(false);
  else clearTimeout(releaseTimer);
};

/** The route change is over (or failed): from here only loaders hold it. */
export const endSessionEntryNavigation = () => {
  if (!navigating) return;
  navigating = false;
  scheduleRelease();
};

/** A session screen is loading: keep the screen covered until it lets go. */
export const holdSessionEntry = (id: string) => {
  holds.add(id);
  if (getState().phase !== "in") enter(true);
  else clearTimeout(releaseTimer);
};

export const releaseSessionEntry = (id: string) => {
  if (!holds.delete(id)) return;
  scheduleRelease();
};

/**
 * Cover the page the player is on, and call back once nothing of it shows —
 * that is the moment to put the session (or the next route) in its place.
 * Returns a cancel for when the session is called off meanwhile.
 */
export const coverForSessionEntry = (id: string, onCovered: () => void): (() => void) => {
  holds.add(id);
  if (getState().phase !== "in") enter(false);
  else clearTimeout(releaseTimer);
  const wait = getState().instant ? 0 : Math.max(0, COVER_MS - (Date.now() - startedAt));
  let handover: ReturnType<typeof setTimeout> | undefined;
  const covered = setTimeout(() => {
    onCovered();
    handover = setTimeout(() => releaseSessionEntry(id), COVER_HANDOVER_MS);
  }, wait);
  return () => {
    clearTimeout(covered);
    clearTimeout(handover);
    releaseSessionEntry(id);
  };
};

/** The scene drew its first frame; the strike is timed from here. */
export const markSessionEntryScene = () => {
  if (sceneAt === null) sceneAt = Date.now();
};

const sameSteps = (a: readonly LoadingStep[], b: readonly LoadingStep[]) =>
  a.length === b.length && a.every((step, i) => step.key === b[i].key && step.state === b[i].state && step.label === b[i].label);

export const setSessionEntrySteps = (steps: readonly LoadingStep[]) => {
  const state = getState();
  if (state.phase === "idle" || steps.length === 0 || sameSteps(state.steps, steps)) return;
  setState({ steps });
};

/** Pages whose first screen is a practice session. */
const SESSION_PATH = /^\/(?:practice\/|songs\/practice\/|onboarding\/first-(?:riff|hunt))/;

export const isSessionEntryPath = (url: string): boolean => SESSION_PATH.test(url);

/** For tests. */
export const resetSessionEntry = () => {
  clearTimeout(releaseTimer);
  clearTimeout(outTimer);
  clearTimeout(giveUpTimer);
  holds.clear();
  navigating = false;
  sceneAt = null;
  setState(INITIAL);
};
