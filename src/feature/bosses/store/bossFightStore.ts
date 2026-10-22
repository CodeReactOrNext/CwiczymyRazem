import type { NoteJudgement } from "feature/exercisePlan/views/PracticeSession/hooks/useNoteMatching";
import { create } from "zustand";

import type { BossRecord, DrillKind } from "../types/boss.types";
import type { BoonId } from "../utils/boons";
import type { BossFightState, FightJudgement } from "../utils/bossEngine";
import { applyJudgement, createFight, endPhaseBreak, pickBoon, rerollDraft } from "../utils/bossEngine";
import { createStrumTally } from "../utils/chordJudging";
import { chordToneCount, chordUnitOf } from "../utils/chordTab";
import type { PhasePlan } from "../utils/phaseGenerator";
import { newRunSeed } from "../utils/phaseGenerator";

interface BossFightStore {
  fight: BossFightState;
  /** The run just lost beat the player's record — set once it is banked. */
  newRecord: boolean;
  /** The record the run just lost was measured against. */
  recordBefore: BossRecord | null;
  setRunVerdict: (verdict: { newRecord: boolean; recordBefore: BossRecord }) => void;
  /** A new run against the same boss, freshly dealt; a seed only to replay one (tests). */
  newRun: (seed?: number) => void;
  /** A new run against the boss whose drill is `kind` — entering a fight. */
  enterFight: (kind: DrillKind, seed?: number) => void;
  judge: (judgement: NoteJudgement) => void;
  /** The boss has changed form; its next phase starts. */
  endPhaseBreak: () => void;
  /** The draft is on screen — the molt is over and the cards are dealt. */
  draftOpen: boolean;
  setDraftOpen: (open: boolean) => void;
  pickBoon: (id: BoonId) => void;
  rerollDraft: () => void;
}

/** The colossus's strums, gathered tone by tone; started over with every phase. */
const strums = createStrumTally();
let strumsPlan: PhasePlan | null = null;

/**
 * What the fight makes of one judged note. The spider takes it as it is; the
 * colossus waits for the strum it belongs to to settle (chordJudging).
 */
const toFightJudgement = (fight: BossFightState, judgement: NoteJudgement): FightJudgement | null => {
  const { plan } = fight;
  if (plan.kind !== "chords") return judgement;
  // Between phases the old tab may still sound — none of it belongs to the new pass.
  if (fight.holding || fight.outcome) return null;
  if (strumsPlan !== plan) {
    strums.clear();
    strumsPlan = plan;
  }
  const unit = chordUnitOf(plan.variation, judgement.noteKey);
  if (unit === null) return null;
  return strums.add(judgement, unit, chordToneCount(plan.variation, unit));
};

const freshRun = (fight: BossFightState) => {
  strums.clear();
  strumsPlan = null;
  return { fight, newRecord: false, recordBefore: null, draftOpen: false };
};

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
    set((state) => freshRun(createFight(seed, state.fight.plan.kind))),
  enterFight: (kind, seed = newRunSeed()) => set(freshRun(createFight(seed, kind))),
  judge: (judgement) =>
    set((state) => {
      const input = toFightJudgement(state.fight, judgement);
      if (!input) return state;
      const fight = applyJudgement(state.fight, input);
      return fight === state.fight ? state : { fight };
    }),
  endPhaseBreak: () =>
    set((state) => ({ fight: endPhaseBreak(state.fight), draftOpen: false })),
  draftOpen: false,
  setDraftOpen: (draftOpen) => set({ draftOpen }),
  pickBoon: (id) => set((state) => ({ fight: pickBoon(state.fight, id), draftOpen: false })),
  rerollDraft: () => set((state) => ({ fight: rerollDraft(state.fight) })),
}));
