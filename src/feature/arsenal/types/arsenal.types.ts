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
}

export interface EffectInventoryItem {
  id: string;
  effectId: number | string;
  acquiredAt: number;
  isNew: boolean;
}

export type GuitarRarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Epic"
  | "Legendary"
  | "Mythic";

export type CaseType = "standard" | "premium" | "elite";

export type ProductionCountry =
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

export const PRODUCTION_COUNTRIES: ProductionCountry[] = [
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

export interface ProbabilityTable {
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

export interface InventoryItem {
  id: string;
  guitarId: number | string;
  acquiredAt: number;
  isNew: boolean;
  year: number;
  country: ProductionCountry;
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
