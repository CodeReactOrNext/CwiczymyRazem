import type { SpiderMood, SpiderPhase } from "../components/FretweaverArt";
import type { SpiderVariation } from "../types/boss.types";
import type { BossFightState } from "./bossEngine";

/**
 * The form the art draws for a phase: purple for the first three, gold up to
 * the seventh, the orange queen after that. Each form wears a later level's
 * markings — bands, then the crown.
 */
export const artPhaseFor = (fight: Pick<BossFightState, "plan">): SpiderPhase => {
  const { index } = fight.plan;
  return index < 3 ? 0 : index < 7 ? 1 : 2;
};

/** The legs tap the first finger order the phase deals. */
export const legPatternFor = (variation: SpiderVariation): number[] =>
  variation.patterns[0].split("").map(Number);

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
