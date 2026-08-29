import type { GuitarRarity } from "feature/arsenal/types/arsenal.types";

/**
 * One slot per rarity the case can roll — every rarity a probability table has,
 * which is all of them bar Custom Shop (never a case drop).
 *
 * Six slots, six winners, so whatever the vote does the composition of the case
 * is fixed in advance and cannot be stacked into six Mythics by a well-organised
 * fortnight.
 */
export type SlateRarity = Exclude<GuitarRarity, "Custom Shop">;

export const SLATE_RARITIES: SlateRarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
];

/** `"guitar:12"` / `"effect:5"` — one string that survives a Firestore map key. */
export type ItemKey = string;

/** Tokens on items, for one seat. */
export type Tally = Record<ItemKey, number>;

/** Tokens on items, for every seat. */
export type SeatTallies = Partial<Record<SlateRarity, Tally>>;

/** An item as the panel renders it, resolved from its key. */
export interface SlateItem {
  key: ItemKey;
  kind: "guitar" | "effect";
  id: number | string;
  name: string;
  brand: string;
  rarity: GuitarRarity;
  /** Pedals only. */
  effectType: string | null;
  /** Points at the item's own artwork — the same picture the Arsenal shows. */
  imageId: string | number;
}

/** A candidate on the ballot for one rarity slot. */
export interface SlateCandidate extends SlateItem {
  /** Everything riding on it: this fortnight's votes plus what rolled over. */
  tokens: number;
  /** The part of `tokens` that survived an earlier slate without winning. */
  carried: number;
  /** Tokens this supporter has on it, carried ones included. */
  mine: number;
}

export interface SlateSlot {
  rarity: SlateRarity;
  /** What is in the case right now for this slot. */
  current: SlateItem | null;
  /** Everything backed for the next cycle, most backed first. */
  candidates: SlateCandidate[];
}

export interface SupporterCaseState {
  /** Cycle the live slate belongs to, e.g. "2026-08-24". */
  cycleId: string;
  /** Cycle currently being voted on. */
  ballotCycleId: string;
  startsAt: string;
  endsAt: string;
  daysLeft: number;
  fameCost: number;
  slots: SlateSlot[];
  /** Tokens this supporter has on the open ballot, carried ones included. */
  myTokens: number;
  isSupporter: boolean;
}
