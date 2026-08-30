import type {
  BodyConstruction,
  BridgeType,
  Electronics,
  GuitarDefinition,
  GuitarRarity,
  GuitarSpec,
  InventoryItem,
  ItemFeature,
  ItemStats,
  PickupConfig,
} from "../types/arsenal.types";

/** Base sell value per rarity — the floor before condition/vintage multipliers. */
export const RARITY_BASE_VALUE: Record<GuitarRarity, number> = {
  Common: 15,
  Uncommon: 30,
  Rare: 75,
  Epic: 150,
  Legendary: 300,
  Mythic: 750,
  // Never minted at this tier — it is only ever reached through the workshop,
  // and sell value is pinned to the mint rarity anyway. Present for completeness.
  "Custom Shop": 1500,
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

/**
 * Item Level a condition grade is worth.
 *
 * Anchored to the *grade*, not to the raw 0–1 float, and deliberately so: the
 * workshop sells restorations by grade ("Good → Mint"), so what a restoration
 * pays has to be a property of the grade too. Scoring `condition * 10` instead
 * made the payout depend on where inside the grade the item happened to roll —
 * a Good at 0.69 and the Mint it restores to at 0.73 both round to 7, so the
 * player spent a full bill of parts for +0 and the job read as broken. Here
 * every step up the ladder is worth a fixed amount, so no restoration is ever
 * worthless and the number in the modal is the number every item gets.
 *
 * Still 0–10 end to end, so no existing level is inflated by the change.
 */
export const CONDITION_LEVEL_POINTS: Record<ConditionKey, number> = {
  Relic: 0,
  Worn: 2,
  Good: 4,
  Mint: 7,
  Museum: 10,
};

/** Item Level contributed by an item's condition — see `CONDITION_LEVEL_POINTS`. */
export const getConditionPoints = (condition: number): number =>
  CONDITION_LEVEL_POINTS[getConditionGrade(condition).key];

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
export const getItemCondition = (
  item: Pick<InventoryItem, "id" | "condition">,
): number =>
  typeof item.condition === "number"
    ? item.condition
    : hashStringToUnit(item.id);

// ─── Multipliers ─────────────────────────────────────────────────────────────

/** 0.70 (Relic) → 1.30 (Museum). */
export const getConditionMultiplier = (condition: number): number =>
  0.7 + condition * 0.6;

/** 1.0 (newest year) → 2.0 (oldest year in the model's range). */
export const getVintageMultiplier = (
  year: number,
  yearFrom: number,
  yearTo: number,
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

/**
 * What a guitar has to be for a mod to go on it.
 *
 * Every field is optional and every one present has to hold — a mod with no
 * requirement at all fits anything with frets, which covers the whole setup and
 * fretwork half of the pool. Kept declarative rather than a predicate per mod so
 * the UI can explain a blocked mod without running it.
 */
export interface ModRequirement {
  /** Bridges this can be fitted to. */
  bridge?: BridgeType[];
  /** Needs a coil to split or tap — so at least one humbucker. */
  humbucker?: boolean;
  /** Needs at least this many pickups to wire together. */
  minPickups?: number;
  /** Bodies this can be cut into. */
  construction?: BodyConstruction[];
  /** The harness this is a part of. */
  electronics?: Electronics[];
  /** Needs tuners on a headstock. */
  headstock?: boolean;
}

export interface GuitarFeatureDef {
  id: string;
  label: string;
  category: StatCategory;
  /** Inclusive point range this feature can roll. */
  min: number;
  max: number;
  /** What the instrument has to be. Omitted = fits every guitar. */
  requires?: ModRequirement;
}

/**
 * Every bridge in the game, derived from the union so the lists below cannot drift.
 *
 * `satisfies` is what makes this safe: adding a bridge type without adding it here
 * fails to compile, and the "everything except" lists then pick it up on their own —
 * a new bridge is assumed to take a mod unless someone says otherwise, which is the
 * forgiving default. The alternative, hand-written allowlists, silently locks a new
 * bridge out of half the pool.
 */
const BRIDGE_TYPES = Object.keys({
  hardtail: 1,
  "vintage-trem": 1,
  "modern-trem": 1,
  floyd: 1,
  "tom-stopbar": 1,
  wraparound: 1,
  "floating-offset": 1,
  biscuit: 1,
} satisfies Record<BridgeType, 1>) as BridgeType[];

/** Tremolos with a sustain block sunk into the body, brass or otherwise. */
const TREM_WITH_BLOCK: BridgeType[] = ["vintage-trem", "modern-trem", "floyd"];

/** A Floyd's nut is the locking clamp; there is no bone to fit in its place. */
const NON_LOCKING_NUT = BRIDGE_TYPES.filter((b) => b !== "floyd");

/**
 * Bridges whose saddles come off on their own. A Floyd's are part of the locking
 * system, and a resonator's biscuit carries one slotted saddle, not six.
 */
const SWAPPABLE_SADDLES = BRIDGE_TYPES.filter(
  (b) => b !== "floyd" && b !== "biscuit",
);

/** A harness with pots to solder into. */
const PASSIVE: Electronics[] = ["passive"];

/** Pool of rollable, invisible-on-image guitar features. Each adds points to its category. */
export const GUITAR_FEATURES: GuitarFeatureDef[] = [
  // Pickups / electronics
  {
    id: "coil-split",
    label: "Coil-split",
    category: "pickups",
    min: 1,
    max: 3,
    requires: { humbucker: true, electronics: PASSIVE },
  },
  {
    id: "hand-wound",
    label: "Hand-wound pickups",
    category: "pickups",
    min: 3,
    max: 5,
    requires: { minPickups: 1 },
  },
  {
    id: "push-pull",
    label: "Push-pull pot",
    category: "pickups",
    min: 1,
    max: 3,
    requires: { electronics: PASSIVE },
  },
  {
    id: "phase-switch",
    label: "Phase switch",
    category: "pickups",
    min: 1,
    max: 2,
    requires: { minPickups: 2, electronics: PASSIVE },
  },
  {
    id: "treble-bleed",
    label: "Treble bleed",
    category: "pickups",
    min: 1,
    max: 2,
    requires: { electronics: PASSIVE },
  },
  {
    id: "cts-pots",
    label: "CTS pots",
    category: "pickups",
    min: 1,
    max: 2,
    requires: { electronics: PASSIVE },
  },
  {
    id: "pio-caps",
    label: "Paper-in-oil caps",
    category: "pickups",
    min: 1,
    max: 3,
    requires: { electronics: PASSIVE },
  },
  {
    id: "active-preamp",
    label: "Active preamp",
    category: "pickups",
    min: 2,
    max: 4,
    requires: { minPickups: 1 },
  },
  {
    id: "copper-shielding",
    label: "Copper shielding",
    category: "pickups",
    min: 1,
    max: 2,
    requires: { electronics: PASSIVE },
  },
  // Sustain / hardware / resonance
  {
    id: "bone-nut",
    label: "Bone nut",
    category: "sustain",
    min: 1,
    max: 2,
    requires: { bridge: NON_LOCKING_NUT },
  },
  {
    id: "brass-trem-block",
    label: "Brass trem block",
    category: "sustain",
    min: 2,
    max: 4,
    requires: { bridge: TREM_WITH_BLOCK },
  },
  {
    id: "steel-saddles",
    label: "Steel saddles",
    category: "sustain",
    min: 1,
    max: 3,
    requires: { bridge: SWAPPABLE_SADDLES },
  },
  {
    id: "locking-tuners",
    label: "Locking tuners",
    category: "sustain",
    min: 1,
    max: 2,
    requires: { headstock: true },
  },
  {
    id: "torrefied-wood",
    label: "Torrefied wood",
    category: "sustain",
    min: 2,
    max: 4,
  },
  {
    id: "chambered-body",
    label: "Chambered body",
    category: "sustain",
    min: 1,
    max: 3,
    requires: { construction: ["solid"] },
  },
  // Play feeling / setup / neck
  {
    id: "plek",
    label: "Plek'd setup",
    category: "playFeeling",
    min: 2,
    max: 4,
  },
  {
    id: "stainless-frets",
    label: "Stainless frets",
    category: "playFeeling",
    min: 2,
    max: 4,
  },
  {
    id: "rolled-edges",
    label: "Rolled edges",
    category: "playFeeling",
    min: 1,
    max: 3,
  },
  {
    id: "scalloped-frets",
    label: "Scalloped fretboard",
    category: "playFeeling",
    min: 1,
    max: 3,
  },
  {
    id: "compound-radius",
    label: "Compound radius",
    category: "playFeeling",
    min: 2,
    max: 4,
  },
  {
    id: "graphite-neck",
    label: "Graphite-reinforced neck",
    category: "playFeeling",
    min: 1,
    max: 2,
  },
  {
    id: "satin-neck",
    label: "Satin neck",
    category: "playFeeling",
    min: 1,
    max: 2,
  },
  {
    id: "low-action",
    label: "Pro low action",
    category: "playFeeling",
    min: 1,
    max: 2,
  },
  {
    id: "truss-wheel",
    label: "Truss-rod wheel",
    category: "playFeeling",
    min: 1,
    max: 1,
  },
  {
    id: "fret-level",
    label: "Fret level & crown",
    category: "playFeeling",
    min: 1,
    max: 3,
  },
];

const FEATURES_BY_ID = new Map(GUITAR_FEATURES.map((f) => [f.id, f]));

/** How many coils each layout carries, and how many of them are humbuckers. */
const PICKUP_COUNT: Record<PickupConfig, number> = {
  SSS: 3,
  SS: 2,
  HSS: 3,
  HSH: 3,
  HH: 2,
  P90: 2,
  none: 0,
};

const HUMBUCKER_COUNT: Record<PickupConfig, number> = {
  SSS: 0,
  SS: 0,
  HSS: 1,
  HSH: 2,
  HH: 2,
  P90: 0,
  none: 0,
};

/** Every condition on the requirement has to hold; an absent one is satisfied. */
export const modFitsSpec = (
  def: Pick<GuitarFeatureDef, "requires">,
  spec: GuitarSpec,
): boolean => {
  const req = def.requires;
  if (!req) return true;
  if (req.bridge && !req.bridge.includes(spec.bridge)) return false;
  if (req.humbucker && HUMBUCKER_COUNT[spec.pickups] === 0) return false;
  if (req.minPickups != null && PICKUP_COUNT[spec.pickups] < req.minPickups) {
    return false;
  }
  if (req.construction && !req.construction.includes(spec.construction)) {
    return false;
  }
  if (req.electronics && !req.electronics.includes(spec.electronics)) {
    return false;
  }
  if (req.headstock && !spec.headstock) return false;
  return true;
};

/**
 * Every mod this guitar could physically take.
 *
 * The one gate in the game: both halves of the system read it, so "what a case can
 * roll on this" and "what the bench will bolt to this" are the same list. They used
 * to be two different answers — the roll had no gate at all and the bench filtered
 * on the salvage BOM — which is how a Les Paul ended up wearing a tremolo block.
 */
export const getEligibleMods = (spec: GuitarSpec): GuitarFeatureDef[] =>
  GUITAR_FEATURES.filter((def) => modFitsSpec(def, spec));

/** Most features a guitar of this rarity *can* have (each slot is then rolled independently). */
export const RARITY_MAX_FEATURES: Record<GuitarRarity, number> = {
  Common: 2,
  Uncommon: 3,
  Rare: 4,
  Epic: 7,
  Legendary: 10,
  Mythic: 13,
  "Custom Shop": 15,
};

/** Independent chance each available slot actually gets filled with a feature. */
export const FEATURE_FILL_CHANCE = 0.55;

export interface ResolvedFeature extends GuitarFeatureDef {
  points: number;
}

/** Per-category sums for a feature list. Re-run whenever the workshop edits one. */
export const sumFeatureStats = (features: ItemFeature[]): ItemStats => {
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
 *
 * Takes the whole definition rather than the rarity, because the pool it draws from
 * is the guitar's own: a Telecaster has no tremolo to block and a resonator has no
 * harness to solder into. `guitarSpecs.test.ts` asserts that no guitar's pool is
 * smaller than the slots its rarity can reach, so this can never run short.
 */
export const rollItemFeatures = (
  guitar: Pick<GuitarDefinition, "rarity" | "spec">,
  rng: () => number = Math.random,
): { features: ItemFeature[]; stats: ItemStats } | undefined => {
  const max = RARITY_MAX_FEATURES[guitar.rarity] ?? 2;
  // Fisher–Yates shuffle so distinct features are picked.
  const pool = getEligibleMods(guitar.spec);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const features: ItemFeature[] = [];
  for (let i = 0; i < max && i < pool.length; i++) {
    if (rng() < FEATURE_FILL_CHANCE) {
      const def = pool[i];
      const points = def.min + Math.floor(rng() * (def.max - def.min + 1));
      features.push({ id: def.id, points });
    }
  }
  if (features.length === 0) return undefined;
  return { features, stats: sumFeatureStats(features) };
};

/** Resolved feature list (with labels/categories) for display. */
export const getItemFeatures = (
  item: Pick<InventoryItem, "features">,
): ResolvedFeature[] =>
  (item.features ?? [])
    .map((f) => {
      const def = FEATURES_BY_ID.get(f.id);
      return def ? { ...def, points: f.points } : null;
    })
    .filter((f): f is ResolvedFeature => f !== null);

/** Per-category stat sums, or `null` when the guitar has no features (plain / legacy). */
export const getItemStats = (
  item: Pick<InventoryItem, "stats">,
): ItemStats | null => item.stats ?? null;

/** Flat level contribution from rarity. */
export const RARITY_LEVEL_BONUS: Record<GuitarRarity, number> = {
  Common: 0,
  Uncommon: 3,
  Rare: 7,
  Epic: 13,
  Legendary: 22,
  Mythic: 35,
  "Custom Shop": 50,
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
 * Item Level gained per workshop build level. The build *cost* is identical for
 * every rarity, so this table is the only thing that makes a Mythic the better
 * thing to sink parts into — without it the cheapest route to a high Rig Level
 * would be pumping Commons, and the whole case economy would stop mattering.
 */
export const RARITY_BUILD_GAIN: Record<GuitarRarity, number> = {
  Common: 1,
  Uncommon: 1,
  Rare: 2,
  Epic: 2,
  Legendary: 3,
  Mythic: 4,
  "Custom Shop": 5,
};

// ─── Rarity promotion ────────────────────────────────────────────────────────

/** Low → high. `Custom Shop` sits at the top and is workshop-only. */
export const RARITY_LADDER: GuitarRarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
  "Custom Shop",
];

/** Build levels that buy one rarity promotion. */
export const BUILDS_PER_PROMOTION = 3;

/** Most promotions any single item can earn, however far it starts down the ladder. */
export const MAX_PROMOTIONS = 3;

/**
 * How many promotions this item could still earn — capped both by the three-per-item
 * rule and by the top of the ladder, so a Mythic gets one (to Custom Shop) and a
 * Common gets the full three.
 */
export const getPromotionsAvailable = (mintRarity: GuitarRarity): number => {
  const index = RARITY_LADDER.indexOf(mintRarity);
  if (index === -1) return 0;
  return Math.min(MAX_PROMOTIONS, RARITY_LADDER.length - 1 - index);
};

/** Promotions actually earned so far — one per three build levels, then it stops. */
export const getPromotions = (
  mintRarity: GuitarRarity,
  buildLevel: number | undefined,
): number =>
  Math.min(
    getPromotionsAvailable(mintRarity),
    Math.floor((buildLevel ?? 0) / BUILDS_PER_PROMOTION),
  );

/**
 * The rarity an item currently *is*, as opposed to the one it was minted at.
 *
 * Derived from `buildLevel` rather than stored: the promotion count is already
 * implied by the build level, so there is no second piece of state to keep in
 * sync and nothing to migrate on existing accounts.
 *
 * Note what deliberately keeps using the *mint* rarity: `getItemValue` and the
 * scrap yield. Promoting must not inflate what the game pays out, and it must not
 * turn a promoted item into a Unique-part source — that would close a loop where
 * Unique parts spent on a promotion come straight back out of the teardown.
 */
export const getEffectiveRarity = (
  mintRarity: GuitarRarity,
  buildLevel: number | undefined,
): GuitarRarity => {
  const index = RARITY_LADDER.indexOf(mintRarity);
  if (index === -1) return mintRarity;
  return (
    RARITY_LADDER[index + getPromotions(mintRarity, buildLevel)] ?? mintRarity
  );
};

/** Item Level a build level adds. Uses the promoted rarity, so gains compound. */
export const getBuildLevelPoints = (
  buildLevel: number | undefined,
  rarity: GuitarRarity,
): number => (buildLevel ?? 0) * (RARITY_BUILD_GAIN[rarity] ?? 1);

/**
 * Item level = rolled feature points + rarity + condition (0–10) +
 * vintage age (0–8) + origin prestige + workshop build. Every guitar has a level;
 * features boost it and the workshop keeps boosting it without a ceiling.
 */
export const getItemLevel = (
  item: Pick<
    InventoryItem,
    "id" | "condition" | "year" | "country" | "stats" | "buildLevel"
  >,
  guitar: Pick<GuitarDefinition, "rarity" | "yearFrom" | "yearTo">,
): number => {
  const s = item.stats;
  // Promotions feed the level twice over — a bigger rarity bonus and a bigger
  // per-build gain — which is what makes the third promotion worth the grind.
  const rarity = getEffectiveRarity(guitar.rarity, item.buildLevel);
  const featurePoints = s ? s.pickups + s.sustain + s.playFeeling : 0;
  const rarityPoints = RARITY_LEVEL_BONUS[rarity] ?? 0;
  const conditionPoints = getConditionPoints(getItemCondition(item));
  const vintagePoints = Math.round(
    (getVintageMultiplier(
      item.year ?? guitar.yearTo,
      guitar.yearFrom,
      guitar.yearTo,
    ) -
      1) *
      8,
  );
  const originPoints = item.country
    ? (COUNTRY_LEVEL_BONUS[item.country] ?? 0)
    : 0;
  const buildPoints = getBuildLevelPoints(item.buildLevel, rarity);
  return (
    featurePoints +
    rarityPoints +
    conditionPoints +
    vintagePoints +
    originPoints +
    buildPoints
  );
};

/**
 * Instance value = base(rarity) × condition × vintage.
 *
 * Condition here is the *mint* condition, not the current one: a workshop
 * restoration must not raise what the game pays. Otherwise buying a Relic cheap,
 * restoring it and selling it back would be a Fame printer. Restoring still pays
 * off — through Item Level, which is what the leaderboard ranks.
 */
export const getItemValue = (
  item: Pick<InventoryItem, "id" | "condition" | "year" | "mintCondition">,
  guitar: Pick<GuitarDefinition, "rarity" | "yearFrom" | "yearTo">,
): number => {
  const base = RARITY_BASE_VALUE[guitar.rarity] ?? 0;
  const condMult = getConditionMultiplier(
    item.mintCondition ?? getItemCondition(item),
  );
  const vintMult = getVintageMultiplier(
    item.year ?? guitar.yearTo,
    guitar.yearFrom,
    guitar.yearTo,
  );
  return Math.round(base * condMult * vintMult);
};

// ─── Rollers (used server-side when minting a new item) ───────────────────────

/**
 * Every roller takes an optional PRNG. Left out it is plain `Math.random`, which
 * is what a case opening wants; the trader passes its seeded generator instead so
 * the exact instance on the shop card is the one the purchase mints — the same
 * numbers on every client and again on the server.
 */

/** Triangular-ish roll (avg of two uniforms) — clusters around the middle grades. */
export const rollCondition = (rng: () => number = Math.random): number =>
  Math.round(((rng() + rng()) / 2) * 1000) / 1000;

/** Year skewed toward newer; old years (true vintage) are rare. */
export const rollVintageYear = (
  yearFrom: number,
  yearTo: number,
  rng: () => number = Math.random,
): number => {
  const span = yearTo - yearFrom;
  if (span <= 0) return yearFrom;
  const r = Math.pow(rng(), 2.2); // bias toward 0 → toward yearTo (newer)
  return yearTo - Math.round(r * span);
};
