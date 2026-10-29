import type { NoteJudgement } from "feature/exercisePlan/views/PracticeSession/hooks/useNoteMatching";
import type { FreePlayFrame } from "feature/exercisePlan/views/PracticeSession/utils/freePlay";
import { create } from "zustand";

import type { BossRecord, DrillKind } from "../types/boss.types";
import type { BoonId } from "../utils/boons";
import type { BossFightState, FightJudgement, FightOptions } from "../utils/bossEngine";
import { applyJudgement, createFight, endPhaseBreak, pickBoon, rerollDraft } from "../utils/bossEngine";
import { createChangesJudge } from "../utils/changesJudge";
import type { ChangesLive } from "../utils/changesLive";
import { IDLE_CHANGES, nextChangesLive } from "../utils/changesLive";
import { createStrumTally } from "../utils/chordJudging";
import { chordToneCount, chordUnitOf } from "../utils/chordTab";
import type { PhasePlan } from "../utils/phaseGenerator";
import { newRunSeed } from "../utils/phaseGenerator";

/**
 * Where the changeling's run is, frame by frame — the board's playhead
 * follows it outside React, which would re-render the board sixty times a
 * second. Null when nothing plays.
 */
export const changesPlayhead: { beat: number | null } = { beat: null };
const playheadListeners = new Set<() => void>();

/** Moves the playhead and tells whoever draws it — only when it moves. */
const setPlayhead = (beat: number | null) => {
  if (changesPlayhead.beat === beat) return;
  changesPlayhead.beat = beat;
  playheadListeners.forEach((listener) => listener());
};

/** Calls `listener` every time the playhead moves, on the free-play feed's frame; returns the unsubscribe. */
export const onPlayhead = (listener: () => void) => {
  playheadListeners.add(listener);
  return () => {
    playheadListeners.delete(listener);
  };
};


interface BossFightStore {
  fight: BossFightState;
  /** The changeling's fight only — see ChangesLive. */
  changesLive: ChangesLive;
  /** The run just lost beat the player's record — set once it is banked. */
  newRecord: boolean;
  /** The record the run just lost was measured against. */
  recordBefore: BossRecord | null;
  setRunVerdict: (verdict: { newRecord: boolean; recordBefore: BossRecord }) => void;
  /** A new run against the same boss, on the same difficulty from the same savepoint, freshly dealt; a seed only to replay one (tests). */
  newRun: (seed?: number) => void;
  /** A new run against the boss whose drill is `kind` — entering a fight. */
  enterFight: (kind: DrillKind, options?: FightOptions & { seed?: number }) => void;
  judge: (judgement: NoteJudgement) => void;
  /** The changeling's fight: the run's clock and the notes since the last frame. */
  feedFreePlay: (frame: FreePlayFrame) => void;
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

/** The changeling's judge, started over with every phase. */
const changes = createChangesJudge();
let changesPlan: PhasePlan | null = null;

const freshRun = (fight: BossFightState) => {
  strums.clear();
  strumsPlan = null;
  changes.reset();
  changesPlan = null;
  setPlayhead(null);
  return { fight, newRecord: false, recordBefore: null, draftOpen: false, changesLive: IDLE_CHANGES };
};

/**
 * The fight in progress. Outside React on purpose: notes arrive from the
 * matching loop, and the arena is mounted by both the desktop and the phone
 * view — one fight, however many views watch it.
 */
export const useBossFightStore = create<BossFightStore>()((set, get) => ({
  fight: createFight(newRunSeed()),
  changesLive: IDLE_CHANGES,
  newRecord: false,
  recordBefore: null,
  setRunVerdict: ({ newRecord, recordBefore }) => set({ newRecord, recordBefore }),
  newRun: (seed = newRunSeed()) =>
    set((state) =>
      freshRun(
        createFight(seed, state.fight.plan.kind, {
          difficulty: state.fight.difficulty,
          startPhase: state.fight.startPhase,
        }),
      ),
    ),
  enterFight: (kind, { seed = newRunSeed(), ...options } = {}) => set(freshRun(createFight(seed, kind, options))),
  judge: (judgement) =>
    set((state) => {
      const input = toFightJudgement(state.fight, judgement);
      if (!input) return state;
      const fight = applyJudgement(state.fight, input);
      return fight === state.fight ? state : { fight };
    }),
  feedFreePlay: (frame) => {
    const { fight: start, changesLive } = get();
    const { plan } = start;
    // Between phases the old pass may still be heard — none of it belongs to the new one.
    if (plan.kind !== "changes" || start.holding || start.outcome) {
      setPlayhead(null);
      return;
    }
    setPlayhead(frame.beat);
    if (changesPlan !== plan) {
      changes.reset();
      changesPlan = plan;
    }
    const events = changes.feed(frame, plan.variation);
    if (!events.length) return;

    let fight = start;
    let live = changesLive;
    for (const event of events) {
      live = nextChangesLive(live, event);
      if (event.type === "note") {
        if (event.verdict !== "free") {
          const hit = event.verdict === "hit";
          fight = applyJudgement(fight, {
            hit,
            // A note of the scale charges 1, a chord tone 3, and 4 dead on the change or a strong beat.
            grade: hit ? (event.role === "passing" ? 1 : 3) : null,
            perfect: event.perfect || !!event.strongBeat?.hit,
            unit: event.unit,
            weak: event.weak,
            landing: event.landing,
            tricks: event.tricks,
          });
        }
      } else if (event.type === "settle") {
        fight = applyJudgement(fight, {
          hit: event.landed,
          grade: event.landed ? 3 : null,
          perfect: false,
          unit: event.unit,
          settle: true,
        });
      }
      // The phase broke or the run ended: the rest belonged to the pass before.
      if (fight.holding || fight.outcome) break;
    }
    // A new pass: where the old one was means nothing in it.
    if (fight.plan !== plan) live = { ...IDLE_CHANGES, changeTick: live.changeTick };
    if (fight !== start || live !== changesLive) set({ fight, changesLive: live });
  },
  endPhaseBreak: () =>
    set((state) => ({ fight: endPhaseBreak(state.fight), draftOpen: false })),
  draftOpen: false,
  setDraftOpen: (draftOpen) => set({ draftOpen }),
  pickBoon: (id) => set((state) => ({ fight: pickBoon(state.fight, id), draftOpen: false })),
  rerollDraft: () => set((state) => ({ fight: rerollDraft(state.fight) })),
}));
