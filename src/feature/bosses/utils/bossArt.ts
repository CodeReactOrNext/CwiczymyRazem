import type { SpiderMood } from "../components/FretweaverArt";
import type { SpiderVariation } from "../types/boss.types";
import type { BossFightState } from "./bossEngine";
import type { PhasePlan } from "./phaseGenerator";

/** A boss's three looks over a fight: its first form, a stronger one, the last. */
export type BossForm = 0 | 1 | 2;

/**
 * The form the art draws for a phase: the first three phases, up to the
 * seventh, and after that — the spider purple, gold, then its orange queen
 * with a later level's markings; the colossus's runes cyan, amber, orange.
 */
export const artPhaseFor = (fight: Pick<BossFightState, "plan">): BossForm => {
  const { index } = fight.plan;
  return index < 3 ? 0 : index < 7 ? 1 : 2;
};

/** The legs tap the first finger order the phase deals; any boss but the spider taps 1234. */
export const legPatternFor = (plan: PhasePlan): number[] =>
  plan.kind === "spider" ? plan.variation.patterns[0].split("").map(Number) : [1, 2, 3, 4];

export const moodFor = (fight: Pick<BossFightState, "outcome">): SpiderMood =>
  fight.outcome === "lost" ? "victorious" : "idle";

const SUBDIVISION_KEYS = {
  1: "quarters",
  2: "eighths",
  3: "triplets",
  4: "sixteenths",
} as const;

/** The translation key of a drill's rhythm. */
export const subdivisionKey = (variation: Pick<SpiderVariation, "notesPerBeat">) =>
  SUBDIVISION_KEYS[variation.notesPerBeat];
