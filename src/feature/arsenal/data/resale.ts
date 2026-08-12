import type { PartId, PartTier, WorkshopKind } from "../types/arsenal.types";
import { getModDef } from "./workshop";

/**
 * Clearing junk out of the stash.
 *
 * Guitars and pedals have always had a sell price; the two things a teardown
 * *produces* — loose parts and rescued mods — had none, so a stash slowly filled
 * with Standard screws and mods that fit nothing the player owns, and the only
 * way out was to never scrap anything.
 *
 * **This is a bin, not an income.** The payout exists so that clutter can leave;
 * it is deliberately not worth farming, and every price here is flat, tiny, and
 * unrelated to what the trader charges for the same thing. Pricing it off the
 * counter — a Legendary part the trader sells for 450 Fame — would make one
 * screw-tier stack worth more than a Legendary guitar, and turn "sell the
 * instrument" into the wrong move: tear it down, sell the pieces, walk away
 * richer. The whole ladder is built the other way round, so the numbers below
 * are held under `RARITY_BASE_VALUE.Common` — the cheapest guitar in the
 * game — no matter how good the roll or how deep the tier.
 *
 * Both prices are recomputed on the server before anything is paid out, the same
 * way the workshop recomputes its bills, so nothing here has to be trusted from
 * the client.
 */

/**
 * Fame per piece. Flat per tier, and a rounding error next to what the same part
 * costs at the trader — the gap is the point, not an oversight.
 */
export const PART_RESALE_VALUE: Record<PartTier, number> = {
  Standard: 1,
  Epic: 3,
  Legendary: 8,
  Unique: 8,
};

/**
 * What any rescued mod is worth before its roll is counted.
 *
 * Set above the part tiers on purpose: a mod is a whole component somebody's
 * teardown gave up, so the worst one in the game still beats a Legendary part
 * off the same bin. It stays well under an instrument all the same.
 */
export const MOD_RESALE_BASE = 3;

/** Points per extra Fame. A perfect roll is worth a few Fame, not a guitar. */
export const MOD_POINTS_PER_FAME = 2;

/** Fame for selling `qty` pieces of a part. */
export const getPartResaleValue = (
  _partId: PartId,
  tier: PartTier,
  qty: number,
): number => (PART_RESALE_VALUE[tier] ?? 1) * Math.max(0, Math.floor(qty));

/**
 * Fame for a rescued mod.
 *
 * The roll counts for something — a `+1` and a `+5` of the same mod are not the
 * same object, and paying the same for both reads as a bug — but barely, so that
 * a good roll is always worth far more fitted than sold. A perfect one nets a
 * handful of Fame; the instrument it could have gone on is worth tens of them.
 */
export const getModResaleValue = (
  kind: WorkshopKind,
  featureId: string,
  points: number,
): number => {
  // A mod that is not in this kind's pool has no business being priced.
  if (!getModDef(kind, featureId)) return 0;

  return (
    MOD_RESALE_BASE +
    Math.floor(Math.max(0, Math.round(points)) / MOD_POINTS_PER_FAME)
  );
};
