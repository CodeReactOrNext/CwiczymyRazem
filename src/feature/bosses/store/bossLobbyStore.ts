import { create } from "zustand";
import { persist } from "zustand/middleware";

import { BOSSES } from "../data/bosses";
import type { BossDifficulty, BossId } from "../types/boss.types";
import { parseDifficulty } from "../utils/difficulty";

interface BossLobbyState {
  /** The difficulty last picked in a lair — remembered on this device, for every boss. */
  difficulty: BossDifficulty;
  setDifficulty: (difficulty: BossDifficulty) => void;
  /** The boss last picked on the select screen. */
  bossId: BossId;
  setBossId: (bossId: BossId) => void;
  /** Bosses whose how-to-play has been shown on this device — it opens on its own only before the first fight. */
  guidesSeen: BossId[];
  markGuideSeen: (bossId: BossId) => void;
}

const parseBossId = (value: unknown): BossId => BOSSES.find((boss) => boss.id === value)?.id ?? BOSSES[0].id;

export const useBossLobbyStore = create<BossLobbyState>()(
  persist(
    (set) => ({
      difficulty: "normal",
      setDifficulty: (difficulty) => set({ difficulty }),
      bossId: BOSSES[0].id,
      setBossId: (bossId) => set({ bossId }),
      guidesSeen: [],
      markGuideSeen: (bossId) =>
        set((state) => (state.guidesSeen.includes(bossId) ? state : { guidesSeen: [...state.guidesSeen, bossId] })),
    }),
    {
      name: "rq_boss_lobby",
      // Rehydrated by BossesView once mounted — see there.
      skipHydration: true,
      partialize: (state) => ({ difficulty: state.difficulty, bossId: state.bossId, guidesSeen: state.guidesSeen }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<BossLobbyState> | undefined;
        return {
          ...current,
          difficulty: parseDifficulty(saved?.difficulty),
          bossId: parseBossId(saved?.bossId),
          guidesSeen: Array.isArray(saved?.guidesSeen)
            ? saved.guidesSeen.filter((id) => BOSSES.some((boss) => boss.id === id))
            : [],
        };
      },
    },
  ),
);
