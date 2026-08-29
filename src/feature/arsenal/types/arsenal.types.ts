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

/**
 * Where a pedal's signal sockets are, so the pedalboard's cable can be drawn
 * plugging into the artwork rather than through it.
 *
 * Positions are fractions of the pedal's own box, `0,0` being its top-left
 * corner, which keeps them true at any board size. `side` is the ordinary
 * enclosure — in on the right face, out on the left, the way the sockets are
 * silkscreened on a real one — and needs no coordinates.
 * `top` covers the pedals whose sockets are silkscreened along the top edge,
 * where the cable has to come up and over instead of straight across.
 */
export interface EffectJackLayout {
  edge: "side" | "top";
  in: { x: number; y: number };
  out: { x: number; y: number };
}

export interface EffectDefinition {
  id: number | string;
  name: string;
  brand: string;
  type: EffectType;
  imageId: number | string;
  rarity: GuitarRarity;
  /** Where its sockets sit. Absent means the ordinary side-mounted pair. */
  jacks?: EffectJackLayout;
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
  /** Rolled traits paying Fame/h while in service. Optional for legacy/plain items. */
  traits?: ItemTrait[];
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
  | "daily"
  | "supporter";

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
  "USA",
  "Japan",
  "Korea",
  "China",
  "Mexico",
  "Indonesia",
  "Czech Republic",
  "Germany",
  "UK",
  "Canada",
  "Sweden",
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

/**
 * A rolled trait (references a TraitDef by id) — see `data/traits.ts`.
 *
 * Deliberately not part of `stats`/`features`: features raise the item's *level*
 * and through it the whole rig's base rate, while a trait pays its own Fame/h on
 * top and usually only while something outside the item is true. Keeping them
 * apart is what stops a trait from silently inflating the gear leaderboard.
 */
export interface ItemTrait {
  id: string;
  /** Rolled Fame/h. Per counted unit when the trait has a counter. */
  value: number;
  /** Rolled parameters, e.g. `{ brand: "Fairmont" }` for `{brand} Endorsement`. */
  params?: Record<string, string>;
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
  /** Rolled traits paying Fame/h while in service. Optional for legacy/plain items. */
  traits?: ItemTrait[];
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
  itemId: string; // EffectInventoryItem.id
  xPct: number; // 0–100 from left edge of board
  yPct: number; // 0–100 from top edge of board
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

/**
 * A mod pulled off an instrument during a teardown and kept.
 *
 * It is a thing, not a currency: one entry per rescued mod, hanging in the stash
 * until it is fitted onto something else. The value it carries is the value it
 * had on the old instrument, minus the teardown's toll — see `data/salvage.ts`.
 */
export interface SalvagedMod {
  /** Stash id. Derived from the item it came off, so it cannot collide. */
  id: string;
  featureId: string;
  /** Which pool the feature belongs to — a pedal mod never fits a guitar. */
  kind: WorkshopKind;
  points: number;
  /** The instrument it was pulled out of. Flavour on the tile. */
  sourceName: string;
  salvagedAt: number;
}

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
  /**
   * Where each item hangs on the stash board — item id → cell index. Purely
   * cosmetic, and always re-resolved on load, so a stale or broken entry costs
   * nothing but the position it asked for. See `utils/stashLayout`.
   */
  stashLayout?: Record<string, number>;
  /** Mods rescued from teardowns, waiting to be fitted onto something else. */
  salvagedMods?: SalvagedMod[];
  /**
   * Every guitarId the account has ever held, whether or not a copy is still in
   * the stash. The Dex reads this — selling, scrapping or listing a model does
   * not un-discover it. Absent until the account's first read after the feature
   * shipped; the inventory route backfills it from what is currently owned.
   */
  dexGuitars?: (number | string)[];
  /** Same, for pedals. See `dexGuitars`. */
  dexEffects?: (number | string)[];
}

export interface ScrapResult {
  /** What this teardown paid out. */
  parts: ScrapPart[];
  /** The full wallet after the teardown. */
  newParts: ScrapPart[];
  /** The one mod that survived the teardown, if the item carried any. */
  salvaged?: SalvagedMod | null;
}

/** What a rework at the bench consumed and produced. See `data/fusion.ts`. */
export interface FusePartsResult {
  /** Fame charged — mirrored into the client's counter, which lives outside the query. */
  fameSpent: number;
  /** The pieces that came out, one tier up. */
  produced: ScrapPart;
  /** The pieces that went in. */
  spent: ScrapPart;
  /** The full wallet afterwards. */
  newParts: ScrapPart[];
  newFame: number;
}

/** What a whole batch teardown paid out — the duplicate sweep's receipt. */
export interface BulkScrapResult {
  /** The merged yield of the whole batch. */
  parts: ScrapPart[];
  /** The full wallet after the teardown. */
  newParts: ScrapPart[];
  /** How many items actually came apart — protected copies are skipped. */
  scrappedCount: number;
  /** How many mods were pulled out whole into the stash. */
  salvagedCount: number;
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

/**
 * Bolting on a mod the player owns, re-rolling one already on the item, or
 * stripping one back off.
 *
 * There is no "buy a mod at the bench" action: a mod is a component, and fitting
 * one means owning one first. `fit-salvaged` therefore names every fit there is —
 * the stash entry it consumes came off a teardown or over the trader's counter,
 * and it keeps the value it arrived with rather than rolling a new one. A removal
 * destroys the mod outright.
 */
export type WorkshopModAction = "reroll" | "remove" | "fit-salvaged";

export interface WorkshopModResult {
  action: WorkshopModAction;
  /** The feature that was fitted, re-rolled or removed. */
  featureId: string;
  label: string;
  /** Zero on a removal — the mod is off the item and worth nothing to it. */
  points: number;
  /** The value before a re-roll or a removal — absent on a fit from the stash. */
  pointsBefore?: number;
  /** Item Level the job was worth. Negative on a removal, or a re-roll gone bad. */
  levelGain: number;
  spent: ScrapPart[];
  /** Fame the job cost. Only a removal charges any — the rest run on parts. */
  fameSpent?: number;
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
