import type { TraderState } from "./trader.types";

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
  | "Boost"
  | "Vibrato"
  | "Tuner";

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

/**
 * One line of an item's bench chronicle: what was done, and when.
 *
 * Kept short (see `BUILD_LOG_LIMIT`) because the whole array travels with the
 * user document on every read of the Arsenal.
 */
export interface BuildLogEntry {
  label: string;
  /** Epoch ms. Absent on entries written before the log carried dates. */
  at?: number;
}

/** Legacy items stored the log as bare labels — `readBuildLog` normalises both. */
export type BuildLogLine = string | BuildLogEntry;

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
  /** Workshop build level — uncapped, each point adds to the level. Absent = 0. */
  buildLevel?: number;
  /** Condition at mint. Pins the sell value so restoring cannot be flipped for profit. */
  mintCondition?: number;
  /** Set once the pedal has been through a workshop repair. */
  restored?: boolean;
  /** Bench work done in the workshop, newest last. Trimmed to the last 10. */
  buildLog?: BuildLogLine[];
}

/**
 * `Custom Shop` is the one tier no case can drop — it exists only at the top of the
 * workshop's promotion ladder, so a player who owns one built it themselves.
 */
export type GuitarRarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Epic"
  | "Legendary"
  | "Mythic"
  | "Custom Shop";

/** Scrap parts run on their own 3-step scale — item rarity decides which tiers roll. */
export type PartTier = "Standard" | "Epic" | "Legendary" | "Unique";

export type PartId =
  // Guitar teardown
  | "body"
  | "neck"
  | "bridge"
  | "pickup"
  | "tuners"
  // Pedal teardown
  | "enclosure"
  | "opamp"
  | "diode"
  // Dropped by both
  | "pot"
  | "screws";

export interface ScrapSlot {
  partId: PartId;
  qty: number;
}

/**
 * What an item physically holds — the hand-authored half of the scrap system.
 * The order is the salvage priority: earlier slots come off first and at a higher
 * tier, and low-rarity gear only ever reaches the first slot or two.
 */
export type ScrapBom = ScrapSlot[];

/** One stack of recovered parts. Parts are a currency: they stack by (partId, tier). */
export interface ScrapPart {
  partId: PartId;
  tier: PartTier;
  qty: number;
}

export type CaseType =
  | "standard"
  | "premium-guitar"
  | "premium-effect"
  | "elite-guitar"
  | "elite-effect"
  | "daily";

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
  /** Locks the drop to one pool. Undefined (standard/daily) rolls from both. */
  dropKind?: "guitar" | "effect";
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
  /** Workshop build level — uncapped, each point adds to the level. Absent = 0. */
  buildLevel?: number;
  /** Condition at mint. Pins the sell value so restoring cannot be flipped for profit. */
  mintCondition?: number;
  /** Set once the guitar has been through a workshop repair. */
  restored?: boolean;
  /** Bench work done in the workshop, newest last. Trimmed to the last 10. */
  buildLog?: BuildLogLine[];
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
  /** Parts recovered from teardowns. A currency: stacked by (partId, tier). */
  parts: ScrapPart[];
  /** What the player has already taken from the trader in the current window. */
  trader?: TraderState;
}

export interface ScrapResult {
  /** What this teardown paid out. */
  parts: ScrapPart[];
  /** The full wallet after the teardown. */
  newParts: ScrapPart[];
}

export interface OpenCaseResult {
  type: "guitar" | "effect";
  guitar?: GuitarDefinition;
  newItem?: InventoryItem;
  newInventory?: InventoryItem[];
  effect?: EffectDefinition;
  effectItem?: EffectInventoryItem;
  newFame: number;
  /** True if this is the first copy of this guitarId/effectId the user has ever pulled (dex-new), as opposed to a duplicate. */
  isNewToDex: boolean;
}

/** Which half of the wallet a workshop job draws on. */
export type WorkshopKind = "guitar" | "effect";

export interface WorkshopBuildResult {
  buildLevel: number;
  /** Item Level this level was worth. */
  levelGain: number;
  /** Fame the build actually cost — the client mirrors it into the header counter. */
  fameSpent: number;
  spent: ScrapPart[];
  /** The finished item, so the result card renders without waiting for a refetch. */
  item: InventoryItem | EffectInventoryItem;
  newParts: ScrapPart[];
  newFame: number;
  rigLevel: number;
}

/** Fitting a new mod, or re-rolling the value of one already on the item. */
export type WorkshopModAction = "fit" | "reroll";

export interface WorkshopModResult {
  action: WorkshopModAction;
  /** The feature that was fitted or re-rolled. */
  featureId: string;
  label: string;
  points: number;
  /** The value before a re-roll — absent on a fresh fit. */
  pointsBefore?: number;
  /** Item Level the job was worth. Negative when a re-roll came out worse. */
  levelGain: number;
  spent: ScrapPart[];
  /** The finished item, so the result card renders without waiting for a refetch. */
  item: InventoryItem | EffectInventoryItem;
  newParts: ScrapPart[];
  rigLevel: number;
}

export interface WorkshopRepairResult {
  grade: string;
  condition: number;
  levelGain: number;
  spent: ScrapPart[];
  /** The finished item, so the result card renders without waiting for a refetch. */
  item: InventoryItem | EffectInventoryItem;
  newParts: ScrapPart[];
  rigLevel: number;
}

export interface OpenEffectPackResult {
  effect: EffectDefinition;
  newItem: EffectInventoryItem;
  newEffectInventory: EffectInventoryItem[];
}
