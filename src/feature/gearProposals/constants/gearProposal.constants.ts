import type { EffectType } from "feature/arsenal/types/arsenal.types";
import type { GearDraft } from "feature/gearProposals/types/gearProposal.types";

/**
 * The pedal types the Arsenal knows. Listed here rather than derived from the
 * `EffectType` union because a union is erased at runtime and both the picker
 * and the server validation need real values to check against.
 */
export const EFFECT_TYPES: EffectType[] = [
  "Overdrive",
  "Distortion",
  "Fuzz",
  "Boost",
  "Delay",
  "Reverb",
  "Chorus",
  "Phaser",
  "Flanger",
  "Vibrato",
  "Wah",
  "Compressor",
  "EQ",
  "Tuner",
];

/** The gear board, as the tab it lives on inside the supporter panel. */
export const GEAR_BOARD_HREF = "/supporter?tab=gear";

/** Where a proposal is written: a page of its own, not a dialog over the board. */
export const PROPOSE_GEAR_HREF = "/supporter/propose-gear";

/**
 * What the form starts on: a Rare guitar with nothing said about it yet.
 *
 * Rare rather than Common because the middle of the scale is the honest default
 * — starting at either end reads as a suggestion about what to ask for.
 */
export const EMPTY_GEAR_DRAFT: GearDraft = {
  kind: "guitar",
  name: "",
  brand: "",
  rarity: "Rare",
  effectType: EFFECT_TYPES[0],
  description: "",
  imageUrl: "",
  inscription: "",
  scrapBom: [],
};
