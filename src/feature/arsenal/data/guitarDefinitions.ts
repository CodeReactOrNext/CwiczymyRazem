import type { GuitarDefinition } from "../types/arsenal.types";

export const GUITAR_DEFINITIONS: GuitarDefinition[] = [
  // Common (1-10)
  { id: 1, imageId: "special/1", name: "Rusty Starter", brand: "Squier", rarity: "Common" },
  { id: 2, imageId: "special/2", name: "Pawnshop Find", brand: "Teisco", rarity: "Common" },
  { id: 3, imageId: "special/3", name: "Student Strat", brand: "Fender", rarity: "Common" },
  { id: 4, imageId: "special/4", name: "Road Worn Tele", brand: "Fender", rarity: "Common" },
  { id: 5, imageId: "special/5", name: "Garage Special", brand: "Cort", rarity: "Common" },
  { id: 6, imageId: "special/6", name: "Basement Axe", brand: "Harley Benton", rarity: "Common" },
  { id: 7, imageId: "special/7", name: "Open Mic Hero", brand: "Yamaha", rarity: "Common" },
  { id: 8, imageId: "special/8", name: "Weekend Warrior", brand: "Epiphone", rarity: "Common" },
  { id: 9, imageId: "special/9", name: "Budget Riff", brand: "Jackson", rarity: "Common" },
  { id: 10, imageId: "special/10", name: "First Timer", brand: "Ibanez", rarity: "Common" },
  // Uncommon (11-16)
  { id: 11, imageId: "special/11", name: "Club Circuit", brand: "Gretsch", rarity: "Uncommon" },
  { id: 12, imageId: "special/12", name: "Stage Ready", brand: "Gibson", rarity: "Uncommon" },
  { id: 13, imageId: "special/13", name: "Venue Veteran", brand: "Fender", rarity: "Uncommon" },
  { id: 14, imageId: "special/14", name: "Tour Bus Rider", brand: "Gibson", rarity: "Uncommon" },
  { id: 15, imageId: "special/15", name: "Opening Act", brand: "Ibanez", rarity: "Uncommon" },
  { id: 16, imageId: "special/16", name: "Sound Check", brand: "PRS", rarity: "Uncommon" },
  // Rare (17-21)
  { id: 17, imageId: "special/17", name: "Studio Session", brand: "Gibson", rarity: "Rare" },
  { id: 18, imageId: "special/18", name: "Signed Edition", brand: "Fender", rarity: "Rare" },
  { id: 19, imageId: "special/19", name: "Headliner", brand: "Fender", rarity: "Rare" },
  { id: 20, imageId: "special/20", name: "Festival King", brand: "ESP", rarity: "Rare" },
  { id: 21, imageId: "special/21", name: "Arena Closer", brand: "Gibson", rarity: "Rare" },
  // Epic (22-25)
  { id: 22, imageId: "special/22", name: "Vintage Reserve", brand: "Gibson", rarity: "Epic" },
  { id: 23, imageId: "special/23", name: "Custom Shop", brand: "PRS", rarity: "Epic" },
  { id: 24, imageId: "special/24", name: "Limited Run", brand: "Rickenbacker", rarity: "Epic" },
  { id: 25, imageId: "special/25", name: "Collector's Cut", brand: "Mayones", rarity: "Epic" },
  // Legendary (26-28)
  { id: 26, imageId: "special/26", name: "Hall of Fame", brand: "Gibson", rarity: "Legendary" },
  { id: 27, imageId: "special/27", name: "Icon Series", brand: "Gretsch", rarity: "Legendary" },
  { id: 28, imageId: "special/28", name: "Rock Legend", brand: "Fender", rarity: "Legendary" },
  // Mythic
  { id: "special-1", imageId: "special-29", name: "Riff Specter", brand: "BC Rich", rarity: "Mythic" },
  { id: "special-2", imageId: "special-30", name: "Celestial Axe", brand: "Music Man", rarity: "Mythic" },
];

export const GUITARS_BY_ID = new Map<number | string, GuitarDefinition>(
  GUITAR_DEFINITIONS.map((g) => [g.id, g])
);

export const GUITARS_BY_RARITY = GUITAR_DEFINITIONS.reduce(
  (acc, g) => {
    if (!acc[g.rarity]) acc[g.rarity] = [];
    acc[g.rarity].push(g);
    return acc;
  },
  {} as Record<string, GuitarDefinition[]>
);
