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
  { id: 10, name: "Cosmic Resonance",   brand: "Astra-Path",  type: "Chorus",    imageId: 10, rarity: "Epic"      },
  { id: 11, name: "Stereo Fuzz Lab",    brand: "VelcroLab",   type: "Fuzz",      imageId: 11, rarity: "Legendary" },
  { id: 12, name: "Stereo Delay Lab",   brand: "ChronosEcho", type: "Delay",     imageId: 12, rarity: "Epic"      },
  { id: 13, name: "Overdrive Pro",      brand: "AstraTone",   type: "Overdrive", imageId: 13, rarity: "Mythic"    },
  { id: 14, name: "Astral Reverberator", brand: "Gravinix",   type: "Reverb",    imageId: 15, rarity: "Legendary" },
  // New batch (15-19) — marki są placeholderami, do poprawki
  { id: 15, name: "Cymatic Current",    brand: "Gravinix",   type: "Vibrato",   imageId: 16, rarity: "Rare"     },
  { id: 16, name: "Deep Echo",          brand: "Gravinix",   type: "Reverb",    imageId: 17, rarity: "Epic"     },
  { id: 17, name: "Professional Overdrive OD-5", brand: "Ronin", type: "Overdrive", imageId: 18, rarity: "Uncommon" },
  { id: 18, name: "Chromatic Tuner AT-10", brand: "Ronin",   type: "Tuner",     imageId: 19, rarity: "Common"   },
  { id: 19, name: "Graphic EQ GE-10",   brand: "Ronin",      type: "EQ",        imageId: 20, rarity: "Uncommon" },
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
