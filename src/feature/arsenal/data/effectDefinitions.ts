import type { EffectDefinition } from "../types/arsenal.types";

export const EFFECT_DEFINITIONS: EffectDefinition[] = [
  { id: 1, name: "EchoPath",          brand: "EchoPath", type: "Delay",     imageId: 1, rarity: "Uncommon" },
  { id: 2, name: "TS-808 Overdrive",  brand: "K",        type: "Overdrive", imageId: 2, rarity: "Common"   },
  { id: 3, name: "Amber Forge",       brand: "Forge",    type: "Overdrive", imageId: 3, rarity: "Rare"     },
  { id: 4, name: "Amber Forge AF",    brand: "Friedman", type: "Overdrive", imageId: 4, rarity: "Epic"     },
  { id: 5, name: "Amber Forge Wood",  brand: "Forge",    type: "Overdrive", imageId: 5, rarity: "Uncommon" },
  { id: 6, name: "Stellar OD",        brand: "JHS",      type: "Overdrive", imageId: 6, rarity: "Rare"     },
  { id: 7, name: "Red Forge Mini",    brand: "Forge",    type: "Overdrive", imageId: 7, rarity: "Common"   },
  { id: 8, name: "Forest Drive",      brand: "Forge",    type: "Overdrive", imageId: 8, rarity: "Uncommon" },
  { id: 9, name: "Orange Forge",      brand: "Forge",    type: "Phaser",    imageId: 9, rarity: "Epic"     },
];

export const EFFECTS_BY_ID = new Map<number | string, EffectDefinition>(
  EFFECT_DEFINITIONS.map((e) => [e.id, e])
);

export const EFFECTS_BY_RARITY = EFFECT_DEFINITIONS.reduce(
  (acc, e) => {
    if (!acc[e.rarity]) acc[e.rarity] = [];
    acc[e.rarity].push(e);
    return acc;
  },
  {} as Record<string, EffectDefinition[]>
);
