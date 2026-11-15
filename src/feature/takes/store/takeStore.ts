import type { TakeEntry, TakeMode } from "types/takes";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TakeStatus = "idle" | "starting" | "recording" | "saving";

/** Why the last take did not start or save, in the terms the menu explains it. */
export type TakeFailure = "no_board" | "failed";

/** The sync correction's reach either way, in ms. */
export const MAX_TAKE_TRIM_MS = 150;

interface TakeState {
  /** What the player last chose — remembered on this device. */
  mode: TakeMode;
  setMode: (mode: TakeMode) => void;
  /** Audio takes: the guitar and the backing as separate files. */
  split: boolean;
  setSplit: (split: boolean) => void;
  /** Their own correction to how the guitar sits against the backing; positive moves the guitar later. */
  trimMs: number;
  setTrimMs: (trimMs: number) => void;

  /** The take in progress, owned by takeController. */
  status: TakeStatus;
  activeMode: TakeMode | null;
  startedAt: number | null;
  /** Whether the running take has a guitar at all, and whether it is the amp's sound. */
  guitar: "amp" | "direct" | "none" | null;
  failure: TakeFailure | null;
  /** The take that was just saved, until the next one starts. */
  lastSaved: TakeEntry | null;
  setLive: (
    live: Partial<Pick<TakeState, "status" | "activeMode" | "startedAt" | "guitar" | "failure" | "lastSaved">>,
  ) => void;
}

function clampTrim(value: unknown) {
  const ms = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 0;
  return Math.max(-MAX_TAKE_TRIM_MS, Math.min(MAX_TAKE_TRIM_MS, ms));
}

export const useTakeStore = create<TakeState>()(
  persist(
    (set) => ({
      mode: "audio",
      setMode: (mode) => set({ mode }),
      split: false,
      setSplit: (split) => set({ split }),
      trimMs: 0,
      setTrimMs: (trimMs) => set({ trimMs: clampTrim(trimMs) }),

      status: "idle",
      activeMode: null,
      startedAt: null,
      guitar: null,
      failure: null,
      lastSaved: null,
      setLive: (live) => set(live),
    }),
    {
      name: "rq_takes",
      partialize: (state) => ({ mode: state.mode, split: state.split, trimMs: state.trimMs }),
      merge: (persisted, current) => {
        const stored = (persisted ?? {}) as Partial<TakeState>;
        return {
          ...current,
          mode: stored.mode === "video" ? "video" : "audio",
          split: !!stored.split,
          trimMs: clampTrim(stored.trimMs),
        };
      },
    },
  ),
);
