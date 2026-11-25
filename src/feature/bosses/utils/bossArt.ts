import type { SpiderMood } from "../components/FretweaverArt";
import type { BossId, SpiderVariation } from "../types/boss.types";
import type { BossFightState } from "./bossEngine";
import type { PhasePlan } from "./phaseGenerator";

/** A boss's three looks over a fight: its first form, a stronger one, the last. */
export type BossForm = 0 | 1 | 2;

/**
 * The stage's light, in the colour of the boss's form — the spider's purple,
 * gold and enraged orange, the colossus's cyan runes, amber and orange — taken
 * half-way to grey and kept low, one gradient falling from the top: a lit
 * stage, not a coloured box.
 */
const STAGE_LIGHT: Record<BossId, Record<BossForm, string>> = {
  fretweaver: { 0: "120, 72, 159", 1: "165, 117, 63", 2: "174, 101, 67" },
  colossus: { 0: "64, 115, 133", 1: "165, 117, 63", 2: "174, 101, 67" },
  changeling: { 0: "58, 122, 99", 1: "165, 117, 63", 2: "174, 101, 67" },
};

export const stageStyle = (boss: BossId, form: BossForm) => {
  const light = STAGE_LIGHT[boss][form];
  return {
    backgroundImage: `linear-gradient(180deg, rgba(${light}, 0.26) 0%, rgba(${light}, 0.08) 55%, rgba(9, 9, 11, 0) 100%)`,
  };
};

/**
 * A boss's poster on the select screen: one flat ground in its colour, light
 * enough that the near-black figure reads whole, running into its own shade.
 */
const POSTER_GROUND: Record<BossId, { face: string; shade: string }> = {
  fretweaver: { face: "#6b4a8c", shade: "#43305a" },
  colossus: { face: "#3f6f80", shade: "#284753" },
  changeling: { face: "#3c7a64", shade: "#264e40" },
};

export const posterStyle = (boss: BossId) => ({
  backgroundImage: `linear-gradient(180deg, ${POSTER_GROUND[boss].face}, ${POSTER_GROUND[boss].shade})`,
});

/** The shade the poster's name and keys stand on, over the figure's feet. */
export const posterFadeStyle = (boss: BossId) => ({
  backgroundImage: `linear-gradient(0deg, ${POSTER_GROUND[boss].shade} 55%, transparent)`,
});

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
