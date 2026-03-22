import type { GuitarDefinition } from "../types/arsenal.types";

export const GUITAR_DEFINITIONS: GuitarDefinition[] = [
  // Common (1-10)
  { id: 1, imageId: "special/1", name: "SV6 Core", brand: "Skalberg", rarity: "Epic", yearFrom: 2014, yearTo: 2026, countries: ["China", "Indonesia", 'Sweden'] },
  { id: 2, imageId: "special/2", name: "SV6 Core", brand: "Skalberg", rarity: "Epic", yearFrom: 2014, yearTo: 2026, countries: ["China", "Indonesia", 'Sweden'] },
  { id: 3, imageId: "special/3", name: "Aurelis Custom", brand: "Velmora", rarity: "Epic", yearFrom: 1960, yearTo: 1990, countries: ["USA"] },
  { id: 4, imageId: "special/4", name: "Aurelis", brand: "Velmora", rarity: "Uncommon", yearFrom: 1980, yearTo: 2010, countries: ["Mexico", "Japan", "USA"] },
  { id: 5, imageId: "special/5", name: "Aurelis Deluxe", brand: "Velmora", rarity: "Epic", yearFrom: 1980, yearTo: 2010, countries: ["Japan", "USA"] },
  { id: 6, imageId: "special/6", name: "Tidecaster Custom", brand: "Driftwood", rarity: "Epic", yearFrom: 1970, yearTo: 1980, countries: ["USA"] },
  { id: 7, imageId: "special/7", name: "Bluewave", brand: "Fairmont", rarity: "Uncommon", yearFrom: 1990, yearTo: 2023, countries: ["Indonesia", "China", 'Mexico'] },
  { id: 8, imageId: "special/8", name: "Horizon", brand: "Fairmont", rarity: "Common", yearFrom: 1990, yearTo: 2023, countries: ["China", "Korea"] },
  { id: 9, imageId: "special/9", name: "Horizon Deluxe", brand: "Fairmont", rarity: "Uncommon", yearFrom: 1990, yearTo: 2023, countries: ["Indonesia", "China", "Korea"] },
  { id: 10, imageId: "special/10", name: "Monarch V Custom Shop", brand: "Grayson", rarity: "Legendary", yearFrom: 1960, yearTo: 1990, countries: ["USA"] },
  // Uncommon (11-16)
  { id: 11, imageId: "special/11", name: "Monarch V", brand: "Grayson", rarity: "Common", yearFrom: 1960, yearTo: 2020, countries: ["China", "Korea"] },
  { id: 12, imageId: "special/12", name: "Monarch V Deluxe", brand: "Grayson", rarity: "Uncommon", yearFrom: 1960, yearTo: 2020, countries: ["China", "Korea"] },
  { id: 13, imageId: "special/13", name: "Monarch V", brand: "Grayson", rarity: "Common", yearFrom: 1960, yearTo: 2020, countries: ["China", "Korea"] },
  { id: 14, imageId: "special/14", name: "Lewis Palmer", brand: "Grayson", rarity: "Uncommon", yearFrom: 1960, yearTo: 2023, countries: ["Korea", "USA"] },
  { id: 15, imageId: "special/15", name: "Lewis Palmer", brand: "Corvin", rarity: "Common", yearFrom: 2000, yearTo: 2018, countries: ["Indonesia", "Korea"] },
  { id: 16, imageId: "special/16", name: "Omega", brand: "Izanor", rarity: "Rare", yearFrom: 2012, yearTo: 2023, countries: ["USA", 'Japan'] },
  // Rare (17-21)
  { id: 17, imageId: "special/17", name: "Omega", brand: "Izanor", rarity: "Rare", yearFrom: 2012, yearTo: 2023, countries: ["USA", 'Japan'] },
  { id: 18, imageId: "special/18", name: "JSC", brand: "Izanor", rarity: "Common", yearFrom: 1998, yearTo: 2005, countries: ['China', 'Korea'] },
  { id: 19, imageId: "special/19", name: "Lewis Palmer Custom Shop", brand: "Grayson", rarity: "Legendary", yearFrom: 1960, yearTo: 1980, countries: ["Canada", "USA"] },
  { id: 20, imageId: "special/20", name: "Tidecaster", brand: "Fairmont", rarity: "Rare", yearFrom: 2000, yearTo: 2018, countries: ["Japan", "USA"] },
  // Epic (22-25)
  { id: 22, imageId: "special/22", name: "RX-1000", brand: "Izanor", rarity: "Epic", yearFrom: 2010, yearTo: 2023, countries: ["USA", 'Japan'] },
  { id: 23, imageId: "special/23", name: "RX-200", brand: "Izanor", rarity: "Common", yearFrom: 2010, yearTo: 2023, countries: ["Indonesia", "China", "Korea"] },
  { id: 24, imageId: "special/24", name: "Stratocaster", brand: "Fairmont", rarity: "Common", yearFrom: 1990, yearTo: 2012, countries: ["Indonesia", "China", "Korea", 'Mexico'] },
  { id: 25, imageId: "special/25", name: "RZ344", brand: "Corvin", rarity: "Rare", yearFrom: 1950, yearTo: 2020, countries: ["Czech Republic", 'UK'] },
  // Legendary (26-28)
  { id: 26, imageId: "special/26", name: "Luther Sovereign", brand: "Louis Carver", rarity: "Rare", yearFrom: 1950, yearTo: 1960, countries: ['UK', 'USA'] },
  { id: 27, imageId: "special/27", name: "Stratocaster", brand: "Fairmont", rarity: "Epic", yearFrom: 1990, yearTo: 2012, countries: ["USA"] },
  { id: 28, imageId: "special/28", name: "Tidecaster", brand: "Fairmont", rarity: "Uncommon", yearFrom: 2000, yearTo: 2018, countries: ["Japan", "Mexico"] },
  // Common (29-31)
  {
    id: 29, imageId: "special/29", name: "Tidecaster", brand: "Fairmont", rarity: "Rare", yearFrom: 1980, yearTo: 2018, countries: ["Japan", "Mexico", 'USA', 'Canada'
    ]
  },
  { id: 30, imageId: "special/30", name: "RZXX-200", brand: "Izanor", rarity: "Uncommon", yearFrom: 2000, yearTo: 2023, countries: ["Indonesia", "China", "Korea"] },
  {
    id: 31, imageId: "special/31", name: "RX-800", brand: "Izanor", rarity: "Uncommon", yearFrom: 1980, yearTo: 2018, countries: ["Japan", "Mexico", 'USA', 'Canada'
    ]
  },
  {
    id: 32, imageId: "special/32", name: "SU 650", brand: "Grayson", rarity: "Rare", yearFrom: 1980, yearTo: 2018, countries: ["Japan", "Mexico", 'USA', 'Canada'
    ]
  },
  {
    id: 33, imageId: "special/33", name: "JTY", brand: "Izanor", rarity: "Mythic", yearFrom: 1980, yearTo: 2018, countries: ['USA', 'Canada'
    ]
  },
  {
    id: 34, imageId: "special/35", name: "Omega Pro", brand: "Izanor", rarity: "Epic", yearFrom: 1980, yearTo: 2018, countries: ['USA', 'Canada'
    ]
  },
  {
    id: 35, imageId: "special/36", name: "SU 650", brand: "Grayson", rarity: "Epic", yearFrom: 1990, yearTo: 2018, countries: ["Japan", 'USA', 'Canada'
    ]
  },
  {
    id: 36, imageId: "special/37", name: "Stratocaster", brand: "Fairmont", rarity: "Epic", yearFrom: 1990, yearTo: 2018, countries: ["Japan", 'USA', 'Canada'
    ]
  },
  {
    id: 37, imageId: "special/38", name: "Modern Super", brand: "Fairmont", rarity: "Common", yearFrom: 2000, yearTo: 2023, countries: ["Japan", 'USA', 'Canada'
    ]
  },
  {
    id: 38, imageId: "special/39", name: "Super Starter", brand: "Fairmont", rarity: "Epic", yearFrom: 2000, yearTo: 2023, countries: ["Japan", 'USA', 'Canada'
    ]
  },
  {
    id: 39, imageId: "special/40", name: "Super Starter", brand: "Fairmont", rarity: "Epic", yearFrom: 2000, yearTo: 2023, countries: ["Japan", 'USA', 'Canada'
    ]
  },
  {
    id: 40, imageId: "special/41", name: "SH Epic", brand: "RPS", rarity: "Epic", yearFrom: 2000, yearTo: 2023, countries: ['USA', 'Canada'
    ]
  },


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
