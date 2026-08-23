import type { SkillsType } from "types/skillsTypes";
import { create } from "zustand";

export type SessionTime = Record<SkillsType, number>;

const EMPTY: SessionTime = {
  technique: 0,
  theory: 0,
  hearing: 0,
  creativity: 0,
};

interface SessionTimeStore {
  time: SessionTime;
  add: (skill: SkillsType, ms: number) => void;
  reset: () => void;
}

/**
 * Time tracked by the practice session that is running right now, split by the
 * category of the exercise it was spent on.
 *
 * Redux `user.timer` cannot answer this. That bucket is the *unreported* time
 * store: it survives reloads, is written by the Free Timer too, and only
 * empties when a report goes through. A scale drill (category `theory`) that
 * was opened and abandoned therefore left minutes sitting in it, and the next
 * session reported them as its own — a pure technique exercise came back logged
 * as half theory. The session reports what it measured itself; the
 * leftovers stay in Redux until the player reports them.
 */
export const useSessionTimeStore = create<SessionTimeStore>()((set) => ({
  time: EMPTY,
  add: (skill, ms) =>
    set((state) => ({ time: { ...state.time, [skill]: state.time[skill] + ms } })),
  reset: () => set({ time: EMPTY }),
}));

/** Total ms tracked in the running session, across every category. */
export const sumSessionTime = (time: SessionTime) =>
  time.technique + time.theory + time.hearing + time.creativity;
