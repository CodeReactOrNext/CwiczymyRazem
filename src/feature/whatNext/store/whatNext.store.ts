import { create } from "zustand";
import { persist } from "zustand/middleware";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Entries older than this are dropped on the next write, so the store never grows. */
const KEEP_MS = 14 * DAY_MS;

interface WhatNextState {
  /** Action id → epoch ms until which it stays hidden. */
  snoozed: Record<string, number>;
  /** Action id → epoch ms of the last tap on it. */
  clicked: Record<string, number>;
  /** Hidden until the end of today (local midnight). */
  snoozeForToday: (id: string, dayEndsAt: number) => void;
  snoozeForWeek: (id: string, now?: number) => void;
  markClicked: (id: string, now?: number) => void;
}

const prune = (entries: Record<string, number>, now: number) =>
  Object.fromEntries(
    Object.entries(entries).filter(([, at]) => Math.abs(now - at) < KEEP_MS),
  );

/**
 * What the player waved away and what they last tapped. Per device on purpose:
 * it is a convenience, and losing it only means seeing a suggestion again.
 */
export const useWhatNextStore = create<WhatNextState>()(
  persist(
    (set) => ({
      snoozed: {},
      clicked: {},
      snoozeForToday: (id, dayEndsAt) =>
        set((state) => ({
          snoozed: { ...prune(state.snoozed, Date.now()), [id]: dayEndsAt },
        })),
      snoozeForWeek: (id, now = Date.now()) =>
        set((state) => ({
          snoozed: { ...prune(state.snoozed, now), [id]: now + 7 * DAY_MS },
        })),
      markClicked: (id, now = Date.now()) =>
        set((state) => ({
          clicked: { ...prune(state.clicked, now), [id]: now },
        })),
    }),
    { name: "riffquest-what-next", version: 1 },
  ),
);
