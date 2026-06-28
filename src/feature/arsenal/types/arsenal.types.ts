export type EffectType =
  | "Overdrive"
  | "Distortion"
  | "Delay"
  | "Reverb"
  | "Chorus"
  | "Wah"
  | "Compressor"
  | "EQ"
  | "Fuzz"
  | "Phaser"
  | "Flanger"
  | "Boost";

export interface EffectDefinition {
  id: number | string;
  name: string;
  brand: string;
  type: EffectType;
  imageId: number | string;
  rarity: GuitarRarity;
  /** Optional production-era range for the vintage roll; falls back to global defaults. */
  yearFrom?: number;
  yearTo?: number;
  countries?: string[];
}

/** Per-category stat sums for an effect (Tone / Headroom / Versatility). */
export interface EffectStats {
  tone: number;
  headroom: number;
  versatility: number;
}

export interface EffectInventoryItem {
  id: string;
  effectId: number | string;
  acquiredAt: number;
  isNew: boolean;
  /** Rolled production year (vintage). Optional for legacy items. */
  year?: number;
  /** Country of manufacture. Optional for legacy items. */
  country?: string;
  /** Rolled cosmetic quality float 0–1. Optional for legacy items. */
  condition?: number;
  /** Global mint number for this effectId. Optional for legacy items. */
  serial?: number;
  /** Cached per-category stat sums; their total feeds the level. Optional for legacy/plain items. */
  stats?: EffectStats;
  /** Rolled named features that produced the stats. Optional for legacy/plain items. */
  features?: ItemFeature[];
}

export type GuitarRarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Epic"
  | "Legendary"
  | "Mythic";

export type CaseType = "standard" | "premium" | "elite";

type ProductionCountry =
  | "USA"
  | "Japan"
  | "Korea"
  | "China"
  | "Mexico"
  | "Indonesia"
  | "Czech Republic"
  | "Germany"
  | "UK"
  | "Canada"
  | "Sweden";

const PRODUCTION_COUNTRIES: ProductionCountry[] = [
  "USA", "Japan", "Korea", "China", "Mexico",
  "Indonesia", "Czech Republic", "Germany", "UK", "Canada", "Sweden",
];

export interface GuitarDefinition {
  id: number | string;
  brand: string;
  imageId: number | string;
  name: string;
  rarity: GuitarRarity;
  yearFrom: number;
  yearTo: number;
  countries: ProductionCountry[];
}

interface ProbabilityTable {
  Common: number;
  Uncommon: number;
  Rare: number;
  Epic: number;
  Legendary: number;
  Mythic: number;
}

export interface CaseDefinition {
  id: CaseType;
  name: string;
  description: string;
  fameCost: number;
  probabilities: ProbabilityTable;
  yearFrom: number;
  yearTo: number;
  country: ProductionCountry;
}

/** Per-category stat sums (each a "+N" that adds into the item level). */
export interface ItemStats {
  pickups: number;
  sustain: number;
  playFeeling: number;
}

/** A single rolled named feature on an item (references a GuitarFeatureDef by id). */
export interface ItemFeature {
  id: string;
  points: number;
}

export interface InventoryItem {
  id: string;
  guitarId: number | string;
  acquiredAt: number;
  isNew: boolean;
  year: number;
  country: ProductionCountry;
  /** Rolled quality float 0–1 → condition grade (Relic…Museum). Optional for legacy items. */
  condition?: number;
  /** Global mint number for this guitarId (e.g. 42 → "#0042"). Optional for legacy items. */
  serial?: number;
  /** Cached per-category stat sums; their total is the item level. Optional for legacy/plain items. */
  stats?: ItemStats;
  /** Rolled named features that produced the stats. Optional for legacy/plain items. */
  features?: ItemFeature[];
}

export interface PedalboardPlacement {
  itemId: string;   // EffectInventoryItem.id
  xPct: number;     // 0–100 from left edge of board
  yPct: number;     // 0–100 from top edge of board
}

export interface RigSetup {
  guitarSlots: [string | null, string | null, string | null];
  pedalboardItems: PedalboardPlacement[];
  ampHeadId: string | null;
  ampId: string | null;
}

export const DEFAULT_RIG: RigSetup = {
  guitarSlots: [null, null, null],
  pedalboardItems: [],
  ampHeadId: null,
  ampId: null,
};

export interface ArsenalUserData {
  inventory: InventoryItem[];
  equippedGuitarId: number | string | null;
  /** Unique inventory item id of the equipped guitar — distinguishes duplicates of the same guitarId */
  equippedItemId: string | null;
  rig: RigSetup;
  effectInventory: EffectInventoryItem[];
}

export interface OpenCaseResult {
  type: "guitar" | "effect";
  guitar?: GuitarDefinition;
  newItem?: InventoryItem;
  newInventory?: InventoryItem[];
  effect?: EffectDefinition;
  effectItem?: EffectInventoryItem;
  newFame: number;
}

export interface OpenEffectPackResult {
  effect: EffectDefinition;
  newItem: EffectInventoryItem;
  newEffectInventory: EffectInventoryItem[];
}
