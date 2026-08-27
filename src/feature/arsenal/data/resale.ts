import type { PartId, PartTier, WorkshopKind } from "../types/arsenal.types";
import { getModDef } from "./workshop";

/**
 * Clearing the stash out for Fame.
 *
 * Guitars and pedals have always had a sell price; the two things a teardown
 * *produces* — loose parts and rescued mods — had none, so a stash slowly filled
 * with Standard screws and mods that fit nothing the player owns, and the only
 * way out was to never scrap anything.
 *
 * **Parts are a bin, not an income.** A part is a currency: whatever it buys can
 * be bought again, so the payout exists only so clutter can leave. Every price
 * is flat, tiny, and unrelated to what the trader charges. Pricing it off the
 * counter — a Legendary part the trader sells for 450 Fame — would make one
 * screw-tier stack worth more than a Legendary guitar and turn "sell the
 * instrument" into the wrong move.
 *
 * **A mod is not, and is no longer priced like one.** Since the bench stopped
 * selling mods (see `workshop.ts`), a mod cannot be bought back with parts at
 * any price: it comes off a teardown, out of a case, or over the trader's
 * counter, and there is exactly one per teardown. Paying five Fame for a
 * component the counter charges hundreds for read as a bug, so the mod price
 * below is several times what it was and scales properly with the roll.
 *
 * It is still nowhere near what a mod is *worth*, and that is deliberate: this
 * is the floor, not the price. A scarce mod is meant to go on the marketplace,
 * where another player sets what it costs and this number is only the minimum
 * they may ask (`marketplace/list-item`). The bin is what you use on a mod that
 * fits nothing you own and nobody wants.
 *
 * **What actually bounds the mod price.** Not the instrument it came off — a
 * Common pedal sells for 8 Fame while carrying a component the trader lists at
 * 2000, and pretending the chassis is the valuable half was always the fiction.
 * The real guard is the case that feeds the loop: the cheapest case is 120 Fame
 * and hands back one item, whose teardown yields parts plus *one* mod. As long
 * as liquidating all of that stays far under the case price, no amount of
 * scrapping prints Fame — see `resale.test.ts`, which measures it rather than
 * assuming it.
 *
 * Every price is recomputed on the server before anything is paid out, the same
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
 * Set well above the part tiers on purpose: a part is a currency and a mod is
 * not. The worst mod in the game is still a component the bench cannot make,
 * so it clears a Legendary part off the same bin by a comfortable margin.
 */
export const MOD_RESALE_BASE = 8;

/**
 * Fame per point of roll.
 *
 * The roll is the half of a mod the player can actually invest in — a re-roll
 * costs parts — so it has to move the price by something a player would notice.
 * Two Fame a point spreads the pool from 10 Fame for the junk to 22 for a mod
 * re-rolled to the top of its range, where the old curve ran a flat 4 to 6 and
 * made a perfect roll and a worthless one very nearly the same object.
 */
export const MOD_RESALE_PER_POINT = 2;

/** Fame for selling `qty` pieces of a part. */
export const getPartResaleValue = (
  _partId: PartId,
  tier: PartTier,
  qty: number,
): number => (PART_RESALE_VALUE[tier] ?? 1) * Math.max(0, Math.floor(qty));

/**
 * Fame for a rescued mod, and the floor under any marketplace listing of one.
 *
 * Flat in the mod's identity and linear in its roll: a `+1` and a `+6` of the
 * same feature are not the same object, but a cheap mod and a dear one are worth
 * the same here. That is on purpose — the bill a mod is made of runs from 39 to
 * 852 Fame, and letting that through would pay hundreds for a component that
 * fell off a Common, since the case roller draws features without looking at
 * rarity at all (`rollItemFeatures`). A player who wants that spread lists the
 * mod on the marketplace, where a buyer prices it against the trader's counter.
 */
export const getModResaleValue = (
  kind: WorkshopKind,
  featureId: string,
  points: number,
): number => {
  // A mod that is not in this kind's pool has no business being priced.
  if (!getModDef(kind, featureId)) return 0;

  return (
    MOD_RESALE_BASE + MOD_RESALE_PER_POINT * Math.max(0, Math.round(points))
  );
};
