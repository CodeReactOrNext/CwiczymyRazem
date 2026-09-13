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
  /**
   * The slice of `time` spent on the plan's song items, keyed by song id. A
   * song that sits in the plan twice ticks into the same bucket, so this is
   * "time with the song", not "time per slot" — which is what the song's own
   * progress wants to know.
   */
  songTime: Record<string, number>;
  add: (skill: SkillsType, ms: number, songId?: string) => void;
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
  songTime: {},
  add: (skill, ms, songId) =>
    set((state) => ({
      time: { ...state.time, [skill]: state.time[skill] + ms },
      // One tick, two ledgers: the song's share is a view over the category
      // total, never an addition to it — the report reads both from here, so
      // they cannot disagree about how long the song was played.
      ...(songId
        ? { songTime: { ...state.songTime, [songId]: (state.songTime[songId] ?? 0) + ms } }
        : {}),
    })),
  reset: () => set({ time: EMPTY, songTime: {} }),
}));

/** Total ms tracked in the running session, across every category. */
export const sumSessionTime = (time: SessionTime) =>
  time.technique + time.theory + time.hearing + time.creativity;
