import type { GuitarDefinition, GuitarRarity, InventoryItem, ItemFeature, ItemStats } from "../types/arsenal.types";

/** Base sell value per rarity — the floor before condition/vintage multipliers. */
export const RARITY_BASE_VALUE: Record<GuitarRarity, number> = {
  Common: 15,
  Uncommon: 30,
  Rare: 75,
  Epic: 150,
  Legendary: 300,
  Mythic: 750,
};

export type ConditionKey = "Relic" | "Worn" | "Good" | "Mint" | "Museum";

export interface ConditionGrade {
  key: ConditionKey;
  label: string;
  color: string;
  /** Inclusive lower bound of the 0–1 condition float. */
  min: number;
}

// Ordered high → low so the first match wins.
export const CONDITION_GRADES: ConditionGrade[] = [
  { key: "Museum", label: "Museum Grade", color: "#38bdf8", min: 0.92 },
  { key: "Mint", label: "Mint", color: "#34d399", min: 0.7 },
  { key: "Good", label: "Good", color: "#9ca3af", min: 0.4 },
  { key: "Worn", label: "Worn", color: "#d4a373", min: 0.15 },
  { key: "Relic", label: "Relic", color: "#b45454", min: 0 },
];

export const getConditionGrade = (condition: number): ConditionGrade =>
  CONDITION_GRADES.find((g) => condition >= g.min) ??
  CONDITION_GRADES[CONDITION_GRADES.length - 1];

/** Discrete condition tier for segmented indicators: Relic=1 … Museum=5. */
export const CONDITION_TIERS = CONDITION_GRADES.length;
export const getConditionTier = (condition: number): number => {
  const idx = CONDITION_GRADES.findIndex((g) => condition >= g.min);
  return CONDITION_TIERS - (idx === -1 ? CONDITION_TIERS - 1 : idx);
};

/** Stable 0–1 hash so legacy items (minted before this system) still show a condition. */
const hashStringToUnit = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
};

/** The rolled condition, falling back to a deterministic value for legacy items. */
export const getItemCondition = (item: Pick<InventoryItem, "id" | "condition">): number =>
  typeof item.condition === "number" ? item.condition : hashStringToUnit(item.id);

// ─── Multipliers ─────────────────────────────────────────────────────────────

/** 0.70 (Relic) → 1.30 (Museum). */
export const getConditionMultiplier = (condition: number): number => 0.7 + condition * 0.6;

/** 1.0 (newest year) → 2.0 (oldest year in the model's range). */
export const getVintageMultiplier = (
  year: number,
  yearFrom: number,
  yearTo: number
): number => {
  if (yearTo <= yearFrom) return 1;
  const age = Math.min(1, Math.max(0, (yearTo - year) / (yearTo - yearFrom)));
  return 1 + age;
};

// ─── Rolled stats via named features (Pickups / Sustain / Play Feeling) ───────

export type StatCategory = keyof ItemStats;

export const STAT_KEYS = ["pickups", "sustain", "playFeeling"] as const;

export const STAT_LABELS: Record<StatCategory, string> = {
  pickups: "Pickups",
  sustain: "Sustain",
  playFeeling: "Play Feeling",
};

export interface GuitarFeatureDef {
  id: string;
  label: string;
  category: StatCategory;
  /** Inclusive point range this feature can roll. */
  min: number;
  max: number;
}

/** Pool of rollable, invisible-on-image guitar features. Each adds points to its category. */
export const GUITAR_FEATURES: GuitarFeatureDef[] = [
  // Pickups / electronics
  { id: "coil-split", label: "Coil-split", category: "pickups", min: 1, max: 3 },
  { id: "hand-wound", label: "Hand-wound pickups", category: "pickups", min: 3, max: 5 },
  { id: "push-pull", label: "Push-pull pot", category: "pickups", min: 1, max: 3 },
  { id: "phase-switch", label: "Phase switch", category: "pickups", min: 1, max: 2 },
  { id: "treble-bleed", label: "Treble bleed", category: "pickups", min: 1, max: 2 },
  { id: "cts-pots", label: "CTS pots", category: "pickups", min: 1, max: 2 },
  { id: "pio-caps", label: "Paper-in-oil caps", category: "pickups", min: 1, max: 3 },
  { id: "active-preamp", label: "Active preamp", category: "pickups", min: 2, max: 4 },
  { id: "copper-shielding", label: "Copper shielding", category: "pickups", min: 1, max: 2 },
  // Sustain / hardware / resonance
  { id: "bone-nut", label: "Bone nut", category: "sustain", min: 1, max: 2 },
  { id: "brass-trem-block", label: "Brass trem block", category: "sustain", min: 2, max: 4 },
  { id: "steel-saddles", label: "Steel saddles", category: "sustain", min: 1, max: 3 },
  { id: "locking-tuners", label: "Locking tuners", category: "sustain", min: 1, max: 2 },
  { id: "torrefied-wood", label: "Torrefied wood", category: "sustain", min: 2, max: 4 },
  { id: "chambered-body", label: "Chambered body", category: "sustain", min: 1, max: 3 },
  // Play feeling / setup / neck
  { id: "plek", label: "Plek'd setup", category: "playFeeling", min: 2, max: 4 },
  { id: "stainless-frets", label: "Stainless frets", category: "playFeeling", min: 2, max: 4 },
  { id: "rolled-edges", label: "Rolled edges", category: "playFeeling", min: 1, max: 3 },
  { id: "scalloped-frets", label: "Scalloped frets", category: "playFeeling", min: 1, max: 3 },
  { id: "compound-radius", label: "Compound radius", category: "playFeeling", min: 2, max: 4 },
  { id: "graphite-neck", label: "Graphite-reinforced neck", category: "playFeeling", min: 1, max: 2 },
  { id: "satin-neck", label: "Satin neck", category: "playFeeling", min: 1, max: 2 },
  { id: "low-action", label: "Pro low action", category: "playFeeling", min: 1, max: 2 },
  { id: "truss-wheel", label: "Truss-rod wheel", category: "playFeeling", min: 1, max: 1 },
  { id: "fret-level", label: "Fret level & crown", category: "playFeeling", min: 1, max: 3 },
];

const FEATURES_BY_ID = new Map(GUITAR_FEATURES.map((f) => [f.id, f]));

/** Most features a guitar of this rarity *can* have (each slot is then rolled independently). */
export const RARITY_MAX_FEATURES: Record<GuitarRarity, number> = {
  Common: 2,
  Uncommon: 3,
  Rare: 4,
  Epic: 7,
  Legendary: 10,
  Mythic: 13,
};

/** Independent chance each available slot actually gets filled with a feature. */
export const FEATURE_FILL_CHANCE = 0.55;

export interface ResolvedFeature extends GuitarFeatureDef {
  points: number;
}

const sumFeatureStats = (features: ItemFeature[]): ItemStats => {
  const stats: ItemStats = { pickups: 0, sustain: 0, playFeeling: 0 };
  for (const f of features) {
    const def = FEATURES_BY_ID.get(f.id);
    if (def) stats[def.category] += f.points;
  }
  return stats;
};

/**
 * Roll a set of named features for a newly minted guitar. Up to RARITY_MAX_FEATURES
 * slots, each filled independently — so the count is random and may be 0 (plain guitar,
 * returns `undefined`). Returns both the feature list and the derived per-category sums.
 */
export const rollItemFeatures = (
  rarity: GuitarRarity
): { features: ItemFeature[]; stats: ItemStats } | undefined => {
  const max = RARITY_MAX_FEATURES[rarity] ?? 2;
  // Fisher–Yates shuffle so distinct features are picked.
  const pool = [...GUITAR_FEATURES];
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
  return { features, stats: sumFeatureStats(features) };
};

/** Resolved feature list (with labels/categories) for display. */
export const getItemFeatures = (item: Pick<InventoryItem, "features">): ResolvedFeature[] =>
  (item.features ?? [])
    .map((f) => {
      const def = FEATURES_BY_ID.get(f.id);
      return def ? { ...def, points: f.points } : null;
    })
    .filter((f): f is ResolvedFeature => f !== null);

/** Per-category stat sums, or `null` when the guitar has no features (plain / legacy). */
export const getItemStats = (item: Pick<InventoryItem, "stats">): ItemStats | null =>
  item.stats ?? null;

/** Flat level contribution from rarity. */
export const RARITY_LEVEL_BONUS: Record<GuitarRarity, number> = {
  Common: 0,
  Uncommon: 3,
  Rare: 7,
  Epic: 13,
  Legendary: 22,
  Mythic: 35,
};

/** Level contribution from country of origin (prestige). Unlisted → 0. */
export const COUNTRY_LEVEL_BONUS: Record<string, number> = {
  USA: 6,
  Japan: 6,
  Germany: 5,
  UK: 5,
  Canada: 4,
  Sweden: 4,
  "Czech Republic": 3,
  Korea: 2,
  Mexico: 2,
  China: 1,
  Indonesia: 1,
};

/**
 * Item level = rolled feature points + rarity + condition (0–10) +
 * vintage age (0–8) + origin prestige. Every guitar has a level; features boost it.
 */
export const getItemLevel = (
  item: Pick<InventoryItem, "id" | "condition" | "year" | "country" | "stats">,
  guitar: Pick<GuitarDefinition, "rarity" | "yearFrom" | "yearTo">
): number => {
  const s = item.stats;
  const featurePoints = s ? s.pickups + s.sustain + s.playFeeling : 0;
  const rarityPoints = RARITY_LEVEL_BONUS[guitar.rarity] ?? 0;
  const conditionPoints = Math.round(getItemCondition(item) * 10);
  const vintagePoints = Math.round(
    (getVintageMultiplier(item.year ?? guitar.yearTo, guitar.yearFrom, guitar.yearTo) - 1) * 8
  );
  const originPoints = item.country ? COUNTRY_LEVEL_BONUS[item.country] ?? 0 : 0;
  return featurePoints + rarityPoints + conditionPoints + vintagePoints + originPoints;
};

/** Instance value = base(rarity) × condition × vintage. */
export const getItemValue = (
  item: Pick<InventoryItem, "id" | "condition" | "year">,
  guitar: Pick<GuitarDefinition, "rarity" | "yearFrom" | "yearTo">
): number => {
  const base = RARITY_BASE_VALUE[guitar.rarity] ?? 0;
  const condMult = getConditionMultiplier(getItemCondition(item));
  const vintMult = getVintageMultiplier(item.year ?? guitar.yearTo, guitar.yearFrom, guitar.yearTo);
  return Math.round(base * condMult * vintMult);
};

// ─── Rollers (used server-side when minting a new item) ───────────────────────

/** Triangular-ish roll (avg of two uniforms) — clusters around the middle grades. */
export const rollCondition = (): number => Math.round(((Math.random() + Math.random()) / 2) * 1000) / 1000;

/** Year skewed toward newer; old years (true vintage) are rare. */
export const rollVintageYear = (yearFrom: number, yearTo: number): number => {
  const span = yearTo - yearFrom;
  if (span <= 0) return yearFrom;
  const r = Math.pow(Math.random(), 2.2); // bias toward 0 → toward yearTo (newer)
  return yearTo - Math.round(r * span);
};
