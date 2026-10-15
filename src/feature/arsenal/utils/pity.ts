import { POOL_RARITY_ORDER } from "../data/dailyCase";
import type {
  CaseDefinition,
  CasePityCounters,
  CasePityState,
  CaseType,
  GuitarRarity,
} from "../types/arsenal.types";

/**
 * Pity: what a case owes a player after a run of bad luck.
 *
 * Two independent counters per case, each counting opens since the last hit:
 *
 *   sinceNew   opens that handed back a model the player already had
 *   sinceTop   opens that landed below the case's `top` rarity
 *
 * A rule says "within N", and the counter is the distance covered so far. The
 * open at which a counter reaches N − 1 is the one that is guaranteed: the card
 * prints `N − counter`, so "within 5" reads 5 on a fresh counter and 1 when the
 * next open is the owed one.
 *
 * The counters live in `casePity` at the top of the user document and are
 * written only by `/api/arsenal/open-case`. Rules block the client from writing
 * the field: a counter a player could set would be a guaranteed Mythic on demand.
 *
 * Kept free of imports from the route and the UI so the same arithmetic prints
 * the card and decides the pull.
 */

export const EMPTY_PITY: CasePityCounters = { sinceNew: 0, sinceTop: 0 };

const clampCount = (value: unknown, ceiling: number): number => {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, ceiling);
};

/** The case's rules as numbers the arithmetic can use, or `null` for "no such rule". */
const newLimit = (def: Pick<CaseDefinition, "pity">): number | null =>
  def.pity?.newWithin && def.pity.newWithin > 0 ? def.pity.newWithin : null;

const topLimit = (def: Pick<CaseDefinition, "pity">): number | null =>
  def.pity?.top && def.pity.top.within > 0 ? def.pity.top.within : null;

/** Does this case carry any guarantee at all? */
export const hasPity = (def: Pick<CaseDefinition, "pity">): boolean =>
  newLimit(def) !== null || topLimit(def) !== null;

/**
 * The stored counters for one case, defensively read: absent on every account
 * that has not opened it, and never trusted past the limit the rule allows.
 */
export const readPity = (
  state: CasePityState | Record<string, unknown> | null | undefined,
  def: Pick<CaseDefinition, "id" | "pity">,
): CasePityCounters => {
  const stored = (state as CasePityState | null | undefined)?.[
    def.id as CaseType
  ];
  return {
    sinceNew: clampCount(stored?.sinceNew, (newLimit(def) ?? 1) - 1),
    sinceTop: clampCount(stored?.sinceTop, (topLimit(def) ?? 1) - 1),
  };
};

/** Which guarantees are due on the *next* open of this case. */
export interface PityForce {
  new: boolean;
  top: boolean;
}

export const getPityForce = (
  def: Pick<CaseDefinition, "pity">,
  counters: CasePityCounters,
): PityForce => {
  const newAt = newLimit(def);
  const topAt = topLimit(def);
  return {
    new: newAt !== null && counters.sinceNew >= newAt - 1,
    top: topAt !== null && counters.sinceTop >= topAt - 1,
  };
};

/** What the case card prints. `null` where the case has no such rule. */
export interface PityStatus {
  /** Opens until a never-held model is guaranteed. */
  opensUntilNew: number | null;
  /** Opens until the top rarity is guaranteed, and which rarity that is. */
  opensUntilTop: number | null;
  topRarity: GuitarRarity | null;
}

export const getPityStatus = (
  def: Pick<CaseDefinition, "pity">,
  counters: CasePityCounters,
): PityStatus => {
  const newAt = newLimit(def);
  const topAt = topLimit(def);
  return {
    opensUntilNew:
      newAt !== null ? Math.max(1, newAt - counters.sinceNew) : null,
    opensUntilTop:
      topAt !== null ? Math.max(1, topAt - counters.sinceTop) : null,
    topRarity: def.pity?.top?.rarity ?? null,
  };
};

/** Is `rarity` at or above `floor` on the drop ladder? */
export const isAtLeast = (
  rarity: GuitarRarity,
  floor: GuitarRarity,
): boolean => {
  const index = POOL_RARITY_ORDER.indexOf(rarity);
  const floorIndex = POOL_RARITY_ORDER.indexOf(floor);
  // POOL_RARITY_ORDER is rarest first, and a rarity off the ladder (Custom Shop)
  // is never a drop, so it can never satisfy a rule.
  return index !== -1 && floorIndex !== -1 && index <= floorIndex;
};

/**
 * The counters after one more open.
 *
 * Capped at `within − 1` so a guarantee that could not be honoured — a player
 * with nothing new left under the ceiling — does not run the counter off into
 * numbers the card would have to explain.
 */
export const advancePity = (
  def: Pick<CaseDefinition, "pity">,
  counters: CasePityCounters,
  outcome: { isNew: boolean; rarity: GuitarRarity },
): CasePityCounters => {
  const newAt = newLimit(def);
  const topAt = topLimit(def);

  const sinceNew =
    newAt === null
      ? 0
      : outcome.isNew
        ? 0
        : Math.min(counters.sinceNew + 1, newAt - 1);

  const sinceTop =
    topAt === null || !def.pity?.top
      ? 0
      : isAtLeast(outcome.rarity, def.pity.top.rarity)
        ? 0
        : Math.min(counters.sinceTop + 1, topAt - 1);

  return { sinceNew, sinceTop };
};
