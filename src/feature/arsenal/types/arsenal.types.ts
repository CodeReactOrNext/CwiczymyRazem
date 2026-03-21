export type GuitarRarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Epic"
  | "Legendary"
  | "Mythic";

export type CaseType = "standard" | "premium" | "elite";

export interface GuitarDefinition {
  id: number | string;
  brand: string;
  imageId: number | string;
  name: string;
  rarity: GuitarRarity;
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
}

export interface InventoryItem {
  id: string;
  guitarId: number | string;
  acquiredAt: number;
  isNew: boolean;
}

export interface ArsenalUserData {
  inventory: InventoryItem[];
  equippedGuitarId: number | string | null;
}

export interface OpenCaseResult {
  guitar: GuitarDefinition;
  newItem: InventoryItem;
  newInventory: InventoryItem[];
  newFame: number;
}
