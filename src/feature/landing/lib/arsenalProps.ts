import { CASE_DEFINITIONS } from "feature/arsenal/data/caseDefinitions";
import { EFFECT_DEFINITIONS } from "feature/arsenal/data/effectDefinitions";
import { GUITAR_DEFINITIONS } from "feature/arsenal/data/guitarDefinitions";
import {
  CHAIN_COMPLETE_FAME,
  CHAIN_FLAWLESS_FAME,
  CHAIN_FLAWLESS_MIN_PEDALS,
  CHAIN_LINK_FAME,
  SIGNAL_STAGES,
} from "feature/arsenal/data/signalChain";
import type {
  EffectType,
  GuitarRarity,
} from "feature/arsenal/types/arsenal.types";
import { getEffectImageSrc } from "feature/arsenal/utils/effectImage";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";

export type ArsenalRarity = Exclude<GuitarRarity, "Custom Shop">;

export interface ArsenalGear {
  name: string;
  rarity: ArsenalRarity;
  image: string;
  kind: "guitar" | "pedal";
  /** Pedals only: the signal-path stage it belongs to. */
  stage?: string;
}

export interface ArsenalCase {
  id: string;
  name: string;
  fame: number;
  image: string;
  /** What can drop, in a few words. */
  note: string;
}

export interface ArsenalPageProps {
  counts: { guitars: number; pedals: number; pedalTypes: number };
  rarities: ArsenalRarity[];
  cases: ArsenalCase[];
  /** The hero's three openings: the case, then what came out of it. */
  reveals: {
    caseName: string;
    caseImage: string;
    fame: number;
    gear: ArsenalGear;
    /** The reel it spins through, the gear itself at REEL_WIN. */
    reel: ArsenalGear[];
  }[];
  /** A spread of guitars across every rarity, for the gallery. */
  gallery: ArsenalGear[];
  /** Pedals in signal-path order, for the board demo. */
  chain: ArsenalGear[];
  chainFame: {
    perCable: number;
    flawless: number;
    flawlessMinPedals: number;
    complete: number;
  };
}

const RARITIES: ArsenalRarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
];

/** The shelf as the Cases tab shows it, one card per case (pedal twins folded in). */
const SHELF: { id: string; image: string; note: string }[] = [
  {
    id: "standard",
    image: "/images/case-guitar-standard.webp",
    note: "Anything can drop",
  },
  {
    id: "daily",
    image: "/images/case-featured-hero.webp",
    note: "A rotating pool of ten",
  },
  {
    id: "parts",
    image: "/images/case-parts.webp",
    note: "Guitar Builder parts",
  },
  {
    id: "premium-guitar",
    image: "/images/case-guitar-premium.webp",
    note: "Guitars or pedals, better odds",
  },
  {
    id: "elite-guitar",
    image: "/images/case-guitar-elite.webp",
    note: "Rare or better, guaranteed",
  },
  {
    id: "vault-guitar",
    image: "/images/case-guitar-vault.webp",
    note: "Epic or better, guaranteed",
  },
];

const CASE_NAME_SHORT: Record<string, string> = {
  "premium-guitar": "Premium Case",
  "elite-guitar": "Elite Case",
  "vault-guitar": "Vault Case",
};

const guitar = (def: (typeof GUITAR_DEFINITIONS)[number]): ArsenalGear => ({
  name: def.name,
  rarity: def.rarity as ArsenalRarity,
  image: getRankBadgeSrc(def.imageId, "medium"),
  kind: "guitar",
});

const stageOf = (type: EffectType) =>
  SIGNAL_STAGES.find((stage) => stage.types.includes(type))?.label;

const pedal = (def: (typeof EFFECT_DEFINITIONS)[number]): ArsenalGear => ({
  name: def.name,
  rarity: def.rarity as ArsenalRarity,
  image: getEffectImageSrc(def.imageId, "medium"),
  kind: "pedal",
  stage: stageOf(def.type),
});

/** Tiles in a reel, and where the drop sits — far enough in for a long spin. */
export const REEL_LENGTH = 34;
export const REEL_WIN = 28;
/** The fillers' rarities, mostly the common end, as a real reel reads. */
const REEL_RARITIES: ArsenalRarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Common",
  "Uncommon",
  "Epic",
  "Common",
  "Rare",
  "Uncommon",
  "Common",
  "Legendary",
  "Rare",
  "Uncommon",
  "Common",
  "Epic",
  "Uncommon",
  "Rare",
  "Common",
];

/** A reel of real gear of the drop's kind around the drop itself. */
const reelFor = (gear: ArsenalGear, seed: number): ArsenalGear[] =>
  Array.from({ length: REEL_LENGTH }, (_, i) => {
    if (i === REEL_WIN) return gear;
    const rarity = REEL_RARITIES[(i + seed) % REEL_RARITIES.length];
    if (gear.kind === "pedal") {
      const pool = EFFECT_DEFINITIONS.filter((def) => def.rarity === rarity);
      return pedal(pool[(i * 7 + seed) % pool.length]);
    }
    const pool = GUITAR_DEFINITIONS.filter((def) => def.rarity === rarity);
    return guitar(pool[(i * 7 + seed) % pool.length]);
  });

const firstOf = <T extends { rarity: string }>(list: T[], rarity: string) => {
  const found = list.find((entry) => entry.rarity === rarity);
  if (!found) throw new Error(`Arsenal landing: no ${rarity} in the catalogue`);
  return found;
};

/**
 * Everything the page shows about the game, read from the arsenal data at
 * build time: the real cases and their prices, real gear and its art, and
 * the signal-path payouts. Nothing here is typed in by hand.
 */
export const buildArsenalProps = (): ArsenalPageProps => {
  const cases = SHELF.map((entry) => {
    const def = CASE_DEFINITIONS[entry.id as keyof typeof CASE_DEFINITIONS];
    if (!def) throw new Error(`Arsenal landing: no case "${entry.id}"`);
    return {
      id: entry.id,
      name: CASE_NAME_SHORT[entry.id] ?? def.name,
      fame: def.fameCost,
      image: entry.image,
      note: entry.note,
    };
  });
  const caseById = new Map(cases.map((entry) => [entry.id, entry]));

  const reveals = [
    {
      caseId: "elite-guitar",
      gear: guitar(firstOf(GUITAR_DEFINITIONS, "Legendary")),
    },
    {
      caseId: "elite-guitar",
      caseImage: "/images/case-effects-elite.webp",
      gear: pedal(firstOf(EFFECT_DEFINITIONS, "Legendary")),
    },
    {
      caseId: "vault-guitar",
      gear: guitar(firstOf(GUITAR_DEFINITIONS, "Mythic")),
    },
  ].map(({ caseId, caseImage, gear }, idx) => {
    const shelf = caseById.get(caseId)!;
    return {
      caseName: shelf.name,
      caseImage: caseImage ?? shelf.image,
      fame: shelf.fame,
      gear,
      reel: reelFor(gear, idx * 5),
    };
  });

  // Two of every rarity, picked evenly through the catalogue.
  const gallery = RARITIES.flatMap((rarity) => {
    const ofRarity = GUITAR_DEFINITIONS.filter((def) => def.rarity === rarity);
    const step = Math.max(1, Math.floor(ofRarity.length / 2));
    return [ofRarity[0], ofRarity[step]].filter(Boolean).map(guitar);
  });

  // One pedal per stage a board can actually fill, in the order it is wired.
  const chainTypes: EffectType[] = [
    "Tuner",
    "Overdrive",
    "Chorus",
    "Delay",
    "Reverb",
  ];
  const chain = chainTypes.map((type) => {
    const def = EFFECT_DEFINITIONS.find((entry) => entry.type === type);
    if (!def) throw new Error(`Arsenal landing: no ${type} pedal`);
    return pedal(def);
  });

  return {
    counts: {
      guitars: GUITAR_DEFINITIONS.length,
      pedals: EFFECT_DEFINITIONS.length,
      pedalTypes: new Set(EFFECT_DEFINITIONS.map((def) => def.type)).size,
    },
    rarities: RARITIES,
    cases,
    reveals,
    gallery,
    chain,
    chainFame: {
      perCable: CHAIN_LINK_FAME,
      flawless: CHAIN_FLAWLESS_FAME,
      flawlessMinPedals: CHAIN_FLAWLESS_MIN_PEDALS,
      complete: CHAIN_COMPLETE_FAME,
    },
  };
};
