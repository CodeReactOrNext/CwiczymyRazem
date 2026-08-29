import { EFFECT_DEFINITIONS } from "feature/arsenal/data/effectDefinitions";
import { GUITAR_DEFINITIONS } from "feature/arsenal/data/guitarDefinitions";
import type {
  ItemKey,
  SeatTallies,
  SlateItem,
  SlateRarity,
  Tally,
} from "feature/supporterCase/types/supporterCase.types";
import { SLATE_RARITIES } from "feature/supporterCase/types/supporterCase.types";

export const isSlateRarity = (value: unknown): value is SlateRarity =>
  SLATE_RARITIES.includes(value as SlateRarity);

export const itemKey = (
  kind: "guitar" | "effect",
  id: number | string,
): ItemKey => `${kind}:${id}`;

/** Tally values arrive from Firestore, so nothing is trusted to be a number. */
const positive = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;

/**
 * Every item the game already has at this rarity, guitars and pedals together.
 * The ballot only ever offers things that exist — a slate is a curated pool of
 * real drops, not a wishlist, and gear that has not been built yet lives on the
 * proposals board instead.
 */
export const eligibleItems = (rarity: SlateRarity): SlateItem[] => [
  ...GUITAR_DEFINITIONS.filter((def) => def.rarity === rarity).map((def) => ({
    key: itemKey("guitar", def.id),
    kind: "guitar" as const,
    id: def.id,
    name: def.name,
    brand: def.brand,
    rarity: def.rarity,
    effectType: null,
    imageId: def.imageId,
  })),
  ...EFFECT_DEFINITIONS.filter((def) => def.rarity === rarity).map((def) => ({
    key: itemKey("effect", def.id),
    kind: "effect" as const,
    id: def.id,
    name: def.name,
    brand: def.brand,
    rarity: def.rarity,
    effectType: def.type as string,
    imageId: def.imageId,
  })),
];

/** Resolves a key back to the item, or null if it names nothing in the game. */
export const findItem = (key: ItemKey): SlateItem | null => {
  for (const rarity of SLATE_RARITIES) {
    const found = eligibleItems(rarity).find((item) => item.key === key);
    if (found) return found;
  }
  return null;
};

/** Whether this key is a real item of that exact rarity — the ballot's one rule. */
export const isEligibleFor = (key: ItemKey, rarity: SlateRarity): boolean =>
  eligibleItems(rarity).some((item) => item.key === key);

/**
 * The same item's tokens from several sources, added up.
 *
 * A ballot keeps this fortnight's votes and the carry-over from the last one in
 * separate fields — see `carryOverSeats` — so almost everything that reads a
 * tally has to put the two halves back together first.
 */
export const combineTallies = (...sources: (Tally | undefined)[]): Tally => {
  const total: Tally = {};

  for (const source of sources) {
    for (const [key, tokens] of Object.entries(source ?? {})) {
      const value = positive(tokens);
      if (value === 0) continue;
      total[key] = (total[key] ?? 0) + value;
    }
  }

  return total;
};

/**
 * What the next ballot inherits from this one: every seat's tally except the
 * item that actually took the seat.
 *
 * A token buys exactly one thing — the item it was spent on, sitting in the
 * case for a fortnight — so the winner's backing is spent and clears to zero.
 * Nobody who backed second place got anything for it, so their tokens stay on
 * the board rather than evaporating at midnight. Over a few cycles that turns
 * each seat into a queue: the runner-up opens the next fortnight in front, and
 * an item its backers keep faith with eventually gets its slate instead of
 * losing narrowly forever.
 *
 * Keys that no longer name a real item of that rarity are dropped here too, so
 * a retired item cannot sit in the carry-over holding tokens it can never
 * spend.
 */
export const carryOverSeats = (
  seats: SeatTallies | undefined,
  winners: Partial<Record<SlateRarity, ItemKey | null>>,
): SeatTallies => {
  const carried: SeatTallies = {};

  for (const rarity of SLATE_RARITIES) {
    const seat = seats?.[rarity];
    if (!seat) continue;

    const kept: Tally = {};
    for (const [key, tokens] of Object.entries(seat)) {
      const value = positive(tokens);
      if (value === 0) continue;
      if (key === winners[rarity]) continue;
      if (!isEligibleFor(key, rarity)) continue;
      kept[key] = value;
    }

    if (Object.keys(kept).length > 0) carried[rarity] = kept;
  }

  return carried;
};

/**
 * Winner of one slot. Highest tally takes it; a tie goes to whichever item the
 * game lists first, so the same ballot always resolves the same way rather than
 * depending on Firestore's map ordering.
 */
export const winnerOf = (
  tallies: Tally | undefined,
  rarity: SlateRarity,
): ItemKey | null => {
  const order = eligibleItems(rarity).map((item) => item.key);

  const ranked = Object.entries(tallies ?? {})
    .filter(([key, tokens]) => positive(tokens) > 0 && order.includes(key))
    .sort((a, b) => b[1] - a[1] || order.indexOf(a[0]) - order.indexOf(b[0]));

  return ranked[0]?.[0] ?? null;
};

/**
 * Ballot rows for one slot, most backed first, ties broken the same way.
 *
 * `carried` is split back out of the total for the panel alone: seeing which
 * part of an item's backing survived the last slate is what tells a supporter
 * their losing token is still working.
 */
export const rankCandidates = (
  seat: {
    /** Votes cast into the open ballot. */
    fresh?: Tally;
    /** Tokens that rolled over from the slate before it. */
    carried?: Tally;
    /** This supporter's share of `fresh`. */
    mine?: Tally;
    /** This supporter's share of `carried`. */
    myCarried?: Tally;
  },
  rarity: SlateRarity,
) => {
  const totals = combineTallies(seat.fresh, seat.carried);
  const mine = combineTallies(seat.mine, seat.myCarried);

  return eligibleItems(rarity)
    .map((item, index) => ({
      ...item,
      index,
      tokens: totals[item.key] ?? 0,
      carried: positive(seat.carried?.[item.key]),
      mine: mine[item.key] ?? 0,
    }))
    .filter((candidate) => candidate.tokens > 0)
    .sort((a, b) => b.tokens - a.tokens || a.index - b.index)
    .map(({ index: _index, ...candidate }) => candidate);
};
