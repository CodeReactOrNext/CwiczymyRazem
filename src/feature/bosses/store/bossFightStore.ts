import type { NoteJudgement } from "feature/exercisePlan/views/PracticeSession/hooks/useNoteMatching";
import { create } from "zustand";

import type { BossRecord } from "../types/boss.types";
import type { BoonId } from "../utils/boons";
import type { BossFightState } from "../utils/bossEngine";
import { applyJudgement, createFight, endPhaseBreak, pickBoon, rerollDraft } from "../utils/bossEngine";
import { newRunSeed } from "../utils/phaseGenerator";

interface BossFightStore {
  fight: BossFightState;
  /** The run just lost beat the player's record — set once it is banked. */
  newRecord: boolean;
  /** The record the run just lost was measured against. */
  recordBefore: BossRecord | null;
  setRunVerdict: (verdict: { newRecord: boolean; recordBefore: BossRecord }) => void;
  /** A new run with freshly dealt phases; a seed only to replay one (tests). */
  newRun: (seed?: number) => void;
  judge: (judgement: NoteJudgement) => void;
  /** The boss has changed form; its next phase starts. */
  endPhaseBreak: () => void;
  /** The draft is on screen — the molt is over and the cards are dealt. */
  draftOpen: boolean;
  setDraftOpen: (open: boolean) => void;
  pickBoon: (id: BoonId) => void;
  rerollDraft: () => void;
}

/**
 * The fight in progress. Outside React on purpose: notes arrive from the
 * matching loop, and the arena is mounted by both the desktop and the phone
 * view — one fight, however many views watch it.
 */
export const useBossFightStore = create<BossFightStore>()((set) => ({
  fight: createFight(newRunSeed()),
  newRecord: false,
  recordBefore: null,
  setRunVerdict: ({ newRecord, recordBefore }) => set({ newRecord, recordBefore }),
  newRun: (seed = newRunSeed()) =>
    set({ fight: createFight(seed), newRecord: false, recordBefore: null, draftOpen: false }),
  judge: (judgement) =>
    set((state) => {
      const fight = applyJudgement(state.fight, judgement);
      return fight === state.fight ? state : { fight };
    }),
  endPhaseBreak: () =>
    set((state) => ({ fight: endPhaseBreak(state.fight), draftOpen: false })),
  draftOpen: false,
  setDraftOpen: (draftOpen) => set({ draftOpen }),
  pickBoon: (id) => set((state) => ({ fight: pickBoon(state.fight, id), draftOpen: false })),
  rerollDraft: () => set((state) => ({ fight: rerollDraft(state.fight) })),
}));
