import type {
  EffectDefinition,
  GuitarDefinition,
  GuitarRarity,
} from "../types/arsenal.types";
import { mulberry32, seededShuffle } from "../utils/seededRandom";
import { EFFECT_DEFINITIONS } from "./effectDefinitions";
import { GUITAR_DEFINITIONS } from "./guitarDefinitions";

export const DAILY_POOL_SIZE = 10;

/** How long one featured pool stays up before rotating (in UTC days). */
export const POOL_ROTATION_DAYS = 3;

const MS_PER_DAY = 86_400_000;

/** Guaranteed rarity spread of the daily pool — sums to DAILY_POOL_SIZE. */
export const DAILY_POOL_SLOTS: Record<GuitarRarity, number> = {
  // Custom Shop is workshop-only, so it never enters a drop pool.
  "Custom Shop": 0,
  Mythic: 1,
  Legendary: 1,
  Epic: 2,
  Rare: 2,
  Uncommon: 2,
  Common: 2,
};

/** Fixed iteration order so the seeded draw is deterministic. Rarest first. */
const POOL_RARITY_ORDER: GuitarRarity[] = [
  "Mythic",
  "Legendary",
  "Epic",
  "Rare",
  "Uncommon",
  "Common",
];

export type DailyPoolEntry =
  | { kind: "guitar"; def: GuitarDefinition }
  | { kind: "effect"; def: EffectDefinition };

/**
 * Seed shared by every client and the server: the current rotation window —
 * UTC days since epoch divided into POOL_ROTATION_DAYS-long buckets.
 */
export const getDailyPoolSeed = (date: Date = new Date()): number =>
  Math.floor(date.getTime() / (MS_PER_DAY * POOL_ROTATION_DAYS));

/**
 * The featured pool for the rotation window containing the given date.
 * Deterministic: every client and the server derive the identical pool from
 * the date alone, so the shop preview always matches what open-case can
 * actually drop. Guitars and effects mix freely within each rarity slot.
 * Ordered rarest first.
 */
export const getDailyPool = (date: Date = new Date()): DailyPoolEntry[] => {
  const random = mulberry32(getDailyPoolSeed(date));
  const pool: DailyPoolEntry[] = [];
  for (const rarity of POOL_RARITY_ORDER) {
    const candidates: DailyPoolEntry[] = [
      ...GUITAR_DEFINITIONS.filter((g) => g.rarity === rarity).map((def) => ({
        kind: "guitar" as const,
        def,
      })),
      ...EFFECT_DEFINITIONS.filter((e) => e.rarity === rarity).map((def) => ({
        kind: "effect" as const,
        def,
      })),
    ];
    pool.push(
      ...seededShuffle(candidates, random).slice(0, DAILY_POOL_SLOTS[rarity]),
    );
  }
  return pool;
};

/** Start of the next rotation window (a UTC midnight every POOL_ROTATION_DAYS days). */
export const getNextDailyReset = (date: Date = new Date()): Date =>
  new Date((getDailyPoolSeed(date) + 1) * MS_PER_DAY * POOL_ROTATION_DAYS);
