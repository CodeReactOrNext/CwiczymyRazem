/**
 * The two pieces of hardware the pedalboard is built on: the case the pedals
 * stand in, and the brick that feeds them. Both are bought with Fame, and both
 * are the same shape — a ladder, with the rung the player has reached stored on
 * the rig as a plain index.
 *
 * Until now both were constants, which meant the board had exactly one shape and
 * the brick exactly one number of holes, for everybody, forever. The pedals were
 * the only thing a player collected. Making the case and the supply into things
 * you own turns the board itself into a place to spend: a pedal you cannot fit
 * and a pedal you cannot power are the same kind of problem as a pedal you do
 * not have yet, and all three are fixed by playing.
 *
 * One pedal takes one output, and that is the whole rule the brick has. The two
 * ladders are deliberately out of step: the case starts where every board
 * already was and only grows, while the brick starts well under it, so the
 * first thing a new rig runs out of is holes rather than room.
 *
 * Free of React, of the board's geometry and of Firestore, so the purchase route
 * can price an upgrade with exactly the numbers the board draws.
 */

export interface BoardTier {
  /** Rung on the ladder. This is what is stored on the rig. */
  id: number;
  name: string;
  /**
   * Width of the deck in board units — the same units a pedal is `PEDAL_H` tall
   * in, so a wider case really is a case that fits more, rather than the same
   * board with smaller pedals drawn on it.
   */
  w: number;
  rows: number;
  /**
   * What it costs to step up *to* this tier, in Fame. The first rung is what
   * every account starts on, so it is free by definition.
   */
  fame: number;
  /** One line on the shop card: what the upgrade actually buys. */
  blurb: string;
}

export interface SupplyTier {
  id: number;
  name: string;
  /** Holes on the brick — one per pedal, and the only limit it has. */
  outputs: number;
  fame: number;
  blurb: string;
}

/**
 * ─── The prices ─────────────────────────────────────────────────────────────
 *
 * Recut from the launch numbers (board 400/1200, supply 300/900/1500/2200),
 * which totalled 6500 Fame across both ladders — eighteen Elite cases, or 250
 * days of everything a new player earns. Infrastructure was costing several
 * times the collection it exists to hold, which is backwards: the cases are the
 * loop and have to stay expensive, while a case and a brick are bought once and
 * only make the rest of the game usable.
 *
 * The steps were also the wrong shape. Each rung roughly tripled the one below
 * it, so the ladder read as a wall rather than a climb — and because a rung
 * replaces the unit under it rather than adding to it, the player paid the full
 * sticker again every time. The brick now steps by a flat 150 the whole way up
 * (250 → 400 → 550 → 700) and the case by 250 (350 → 600), so every rung stays
 * dearer than the last without any of them tripling. Both ladders together come
 * to 2850.
 *
 * The floor under all of it is deliberate: no rung is under 250, so a case or a
 * brick is never an afterthought bought out of loose change. That is the 100
 * added to every purchasable rung on top of the recut. The bottom rung of each
 * ladder stays at 0 — it is what every account already owns, not something the
 * shop sells.
 *
 * Only the numbers moved. Nothing about how a rung is bought, migrated or drawn
 * changed with them.
 */

/**
 * The cases.
 *
 * The bottom rung is the board everybody already has — the two-row 16-wide deck
 * that was the only board in the game before any of this existed. Nobody's rig
 * gets smaller for this shipping: the ladder only ever goes up from where the
 * board already was, so no layout ever saved has to be rebuilt.
 *
 * That also fixes which constraint bites first. A new player has ten slots and a
 * four-output brick, so the thing they run out of is *current*, not room — the
 * supply is the first upgrade, and the case is what you buy once you have a
 * brick worth filling. See `SUPPLY_TIERS`, which is the ladder that does start
 * small.
 *
 * Upwards it adds the third row first (the biggest single jump a board can
 * make), and then widens once. Two widening steps was one too many: they buy the
 * same thing as each other, and the second was room no brick in the shop could
 * ever fill.
 */
export const BOARD_TIERS: readonly BoardTier[] = [
  {
    id: 0,
    name: "Touring Case",
    w: 16,
    rows: 2,
    fame: 0,
    blurb: "Two rows, ten pedals — the board every rig starts on.",
  },
  {
    id: 1,
    name: "Stage Rack",
    w: 16,
    rows: 3,
    fame: 350,
    blurb: "A third row, and a second channel to run cable down.",
  },
  {
    id: 2,
    name: "Studio Riser",
    w: 20,
    rows: 3,
    fame: 600,
    blurb: "The same three rows, widened out to six pedals each.",
  },
];

/**
 * The bricks.
 *
 * Four holes to start with, against a starter case that holds ten pedals: the
 * first board a player builds is a board they have to choose the pedals for.
 * The ladder climbs to a hole for every pedal the biggest case can stand up, so
 * the constraint is one a player really does escape — that is what they are
 * paying for.
 */
export const SUPPLY_TIERS: readonly SupplyTier[] = [
  {
    id: 0,
    name: "Forge Supply 4",
    outputs: 4,
    fame: 0,
    blurb: "Four outputs. Four pedals, and then you are choosing.",
  },
  {
    id: 1,
    name: "Forge Supply 8",
    outputs: 8,
    fame: 250,
    blurb: "Eight outputs — room for a second half of the board.",
  },
  {
    id: 2,
    name: "Forge Supply 12",
    outputs: 12,
    fame: 400,
    blurb: "Twelve outputs, and a hole for most of a full case.",
  },
  {
    id: 3,
    name: "Forge Supply 18",
    outputs: 18,
    fame: 550,
    blurb: "Eighteen outputs — a hole for every pedal a case can hold.",
  },
  {
    id: 4,
    name: "Forge Supply 24",
    outputs: 24,
    fame: 700,
    blurb: "Twenty-four outputs. More holes than any case has pedals.",
  },
];

/**
 * The rung a stored index means.
 *
 * Clamped rather than trusted, and absent means the bottom rung: a rig saved
 * before the ladders existed is a rig that has not bought anything yet. That is
 * the whole migration, and it costs nobody anything — the bottom rung of the
 * case ladder *is* the board those rigs were laid out on, so every stored
 * placement lands exactly where it was left. Only the brick changes underneath
 * them, and an unpowered pedal stays on the board where it can be seen.
 */
const rungOf = <T>(ladder: readonly T[], stored: unknown): T => {
  const index = Math.floor(Number(stored));
  if (!Number.isFinite(index) || index < 0) return ladder[0];
  return ladder[Math.min(index, ladder.length - 1)];
};

export const boardTierOf = (stored?: number | null): BoardTier =>
  rungOf(BOARD_TIERS, stored ?? 0);

export const supplyTierOf = (stored?: number | null): SupplyTier =>
  rungOf(SUPPLY_TIERS, stored ?? 0);

/** What either ladder is called where a player has to read it. */
export type HardwareKind = "board" | "supply";

/** What `/api/arsenal/upgrade-rig` hands back once a rung has been paid for. */
export interface UpgradeRigResult {
  kind: HardwareKind;
  /** The rung now owned. */
  tier: number;
  name: string;
  spent: number;
  newFame: number;
}

/**
 * The next rung up, and what it costs — `null` at the top of the ladder.
 *
 * One helper for both, because the shop panel and the purchase route have to
 * agree on the price to the last point, and the cheapest way to guarantee that
 * is for neither of them to do the arithmetic.
 */
export function nextTier(kind: "board", owned: number): BoardTier | null;
export function nextTier(kind: "supply", owned: number): SupplyTier | null;
export function nextTier(
  kind: HardwareKind,
  owned: number,
): BoardTier | SupplyTier | null;
export function nextTier(
  kind: HardwareKind,
  owned: number,
): BoardTier | SupplyTier | null {
  if (kind === "board") {
    return BOARD_TIERS[boardTierOf(owned).id + 1] ?? null;
  }
  return SUPPLY_TIERS[supplyTierOf(owned).id + 1] ?? null;
}
