import type {
  EffectDefinition,
  EffectInventoryItem,
  EffectStats,
  EffectType,
  GuitarRarity,
  ItemFeature,
} from "../types/arsenal.types";
import {
  COUNTRY_LEVEL_BONUS,
  FEATURE_FILL_CHANCE,
  getItemCondition,
  getVintageMultiplier,
  RARITY_LEVEL_BONUS,
  RARITY_MAX_FEATURES,
  rollVintageYear,
} from "./itemStats";

export type EffectStatCategory = keyof EffectStats;

export const EFFECT_STAT_KEYS = ["tone", "headroom", "versatility"] as const;

export const EFFECT_STAT_LABELS: Record<EffectStatCategory, string> = {
  tone: "Tone",
  headroom: "Headroom",
  versatility: "Versatility",
};

// ─── Global vintage defaults (effects have no per-model era unless defined) ────
export const EFFECT_YEAR_FROM = 1975;
export const EFFECT_YEAR_TO = 2024;
export const EFFECT_COUNTRIES = ["USA", "Japan", "UK", "Germany", "China", "Korea", "Canada"];

export interface EffectFeatureDef {
  id: string;
  label: string;
  category: EffectStatCategory;
  min: number;
  max: number;
  /** Effect types this feature can roll on. Omit for universal. */
  appliesTo?: EffectType[];
}

/** Pool of rollable, invisible pedal features. Type-gated where it makes sense. */
export const EFFECT_FEATURES: EffectFeatureDef[] = [
  // Tone — components / voicing
  { id: "nos-opamp", label: "NOS op-amp (JRC4558)", category: "tone", min: 2, max: 5, appliesTo: ["Overdrive", "Distortion", "Boost", "Compressor"] },
  { id: "germanium-diodes", label: "Germanium diodes", category: "tone", min: 2, max: 4, appliesTo: ["Overdrive", "Distortion", "Fuzz", "Boost"] },
  { id: "matched-transistors", label: "Matched transistors", category: "tone", min: 2, max: 4, appliesTo: ["Fuzz", "Overdrive", "Distortion"] },
  { id: "asym-clipping", label: "Asymmetric clipping", category: "tone", min: 1, max: 3, appliesTo: ["Overdrive", "Distortion", "Fuzz"] },
  { id: "led-clipping", label: "LED clipping", category: "tone", min: 1, max: 2, appliesTo: ["Overdrive", "Distortion"] },
  { id: "mosfet-clipping", label: "MOSFET clipping", category: "tone", min: 1, max: 2, appliesTo: ["Overdrive", "Distortion", "Boost"] },
  { id: "carbon-comp", label: "Carbon comp resistors", category: "tone", min: 1, max: 2 },
  { id: "film-caps", label: "Film capacitors", category: "tone", min: 1, max: 2 },
  // Headroom — noise / dynamics / power
  { id: "charge-pump-18v", label: "18V charge pump", category: "headroom", min: 2, max: 4 },
  { id: "true-bypass", label: "True bypass", category: "headroom", min: 1, max: 2 },
  { id: "premium-buffer", label: "Premium buffer", category: "headroom", min: 1, max: 2 },
  { id: "shielding", label: "Low-noise shielding", category: "headroom", min: 1, max: 2 },
  { id: "star-grounding", label: "Star grounding", category: "headroom", min: 1, max: 2 },
  { id: "gold-jacks", label: "Gold-plated jacks", category: "headroom", min: 1, max: 1 },
  { id: "filtered-power", label: "Filtered power", category: "headroom", min: 1, max: 2 },
  // Versatility — controls / routing
  { id: "midi", label: "MIDI control", category: "versatility", min: 2, max: 5, appliesTo: ["Delay", "Reverb", "Chorus", "Phaser", "Flanger", "Vibrato"] },
  { id: "tap-tempo", label: "Tap tempo", category: "versatility", min: 2, max: 4, appliesTo: ["Delay", "Chorus", "Phaser", "Flanger", "Vibrato"] },
  { id: "stereo-io", label: "Stereo I/O", category: "versatility", min: 2, max: 4, appliesTo: ["Delay", "Reverb", "Chorus", "Phaser", "Flanger", "Vibrato"] },
  { id: "presets", label: "Presets", category: "versatility", min: 2, max: 4, appliesTo: ["Delay", "Reverb", "Chorus", "Phaser", "Flanger", "EQ", "Vibrato"] },
  { id: "expression-in", label: "Expression input", category: "versatility", min: 1, max: 3, appliesTo: ["Delay", "Reverb", "Wah", "Phaser", "Flanger", "Chorus", "Vibrato"] },
  { id: "trim-pots", label: "Internal trim pots", category: "versatility", min: 1, max: 3 },
  { id: "dip-switches", label: "DIP switches", category: "versatility", min: 1, max: 3 },
  { id: "relay-switch", label: "Relay soft-switch", category: "versatility", min: 1, max: 2 },
  { id: "kill-dry", label: "Kill-dry / trails", category: "versatility", min: 1, max: 2, appliesTo: ["Delay", "Reverb"] },
];

const EFFECT_FEATURES_BY_ID = new Map(EFFECT_FEATURES.map((f) => [f.id, f]));

/** System sell value per rarity for effects (no condition/vintage multipliers). */
export const RARITY_EFFECT_VALUE: Record<GuitarRarity, number> = {
  Common: 8,
  Uncommon: 15,
  Rare: 40,
  Epic: 75,
  Legendary: 150,
  Mythic: 375,
};

/** Instance sell value for an effect — purely rarity-based. */
export const getEffectValue = (effect: Pick<EffectDefinition, "rarity">): number =>
  RARITY_EFFECT_VALUE[effect.rarity] ?? 0;

export interface ResolvedEffectFeature extends EffectFeatureDef {
  points: number;
}

const sumEffectStats = (features: ItemFeature[]): EffectStats => {
  const stats: EffectStats = { tone: 0, headroom: 0, versatility: 0 };
  for (const f of features) {
    const def = EFFECT_FEATURES_BY_ID.get(f.id);
    if (def) stats[def.category] += f.points;
  }
  return stats;
};

/**
 * Roll features for a newly minted effect, gated by its type. Up to RARITY_MAX_FEATURES
 * slots filled independently — count is random and may be 0 (plain pedal → `undefined`).
 */
export const rollEffectFeatures = (
  rarity: GuitarRarity,
  type: EffectType
): { features: ItemFeature[]; stats: EffectStats } | undefined => {
  const max = RARITY_MAX_FEATURES[rarity] ?? 2;
  const pool = EFFECT_FEATURES.filter((f) => !f.appliesTo || f.appliesTo.includes(type));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const features: ItemFeature[] = [];
  for (let i = 0; i < max && i < pool.length; i++) {
    if (Math.random() < FEATURE_FILL_CHANCE) {
      const def = pool[i];
      const points = def.min + Math.floor(Math.random() * (def.max - def.min + 1));
      features.push({ id: def.id, points });
    }
  }
  if (features.length === 0) return undefined;
  return { features, stats: sumEffectStats(features) };
};

/** Resolved feature list (labels/categories) for display. */
export const getEffectFeatures = (item: Pick<EffectInventoryItem, "features">): ResolvedEffectFeature[] =>
  (item.features ?? [])
    .map((f) => {
      const def = EFFECT_FEATURES_BY_ID.get(f.id);
      return def ? { ...def, points: f.points } : null;
    })
    .filter((f): f is ResolvedEffectFeature => f !== null);

/** Per-category stat sums, or `null` when the pedal has no features (plain / legacy). */
export const getEffectStats = (item: Pick<EffectInventoryItem, "stats">): EffectStats | null =>
  item.stats ?? null;

/** Roll a vintage year / country for a new effect (uses per-def range if present). */
export const rollEffectYear = (effect: EffectDefinition): number =>
  rollVintageYear(effect.yearFrom ?? EFFECT_YEAR_FROM, effect.yearTo ?? EFFECT_YEAR_TO);

export const rollEffectCountry = (effect: EffectDefinition): string => {
  const pool = effect.countries ?? EFFECT_COUNTRIES;
  return pool[Math.floor(Math.random() * pool.length)];
};

/**
 * Effect level = rolled feature points + rarity + condition (0–10) +
 * vintage age (0–8) + origin prestige. Every effect has a level; features boost it.
 */
export const getEffectLevel = (
  item: Pick<EffectInventoryItem, "id" | "condition" | "year" | "country" | "stats">,
  effect: Pick<EffectDefinition, "rarity" | "yearFrom" | "yearTo">
): number => {
  const s = item.stats;
  const featurePoints = s ? s.tone + s.headroom + s.versatility : 0;
  const rarityPoints = RARITY_LEVEL_BONUS[effect.rarity] ?? 0;
  const conditionPoints = Math.round(getItemCondition(item) * 10);
  const yearFrom = effect.yearFrom ?? EFFECT_YEAR_FROM;
  const yearTo = effect.yearTo ?? EFFECT_YEAR_TO;
  const vintagePoints = Math.round(
    (getVintageMultiplier(item.year ?? yearTo, yearFrom, yearTo) - 1) * 8
  );
  const originPoints = item.country ? COUNTRY_LEVEL_BONUS[item.country] ?? 0 : 0;
  return featurePoints + rarityPoints + conditionPoints + vintagePoints + originPoints;
};
