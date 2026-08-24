import type { PartId, PartTier, ScrapPart } from "../types/arsenal.types";
import { PART_TIERS, PARTS_BY_ID } from "./partDefinitions";
import { mergeScrapParts } from "./scrapYield";
import { subtractParts } from "./workshop";

/**
 * Rework: stacking loose parts up a tier.
 *
 * The top of the part ladder had exactly one source. `Unique` comes off nothing
 * but a Mythic teardown (`UNIQUE_PART_RARITY`) and the trader will not stock it
 * (`PART_UNIT_PRICE` has no Unique row), so the only way to pay a promotion slot
 * was to open elite cases until a Mythic fell out and then destroy it. Measured
 * against the real drop tables that is ~11 700 Fame for a single Unique
 * enclosure, six of which one build ladder asks for — the wall players were
 * describing, not bad luck.
 *
 * Rework opens a second door without opening a shortcut. One rule, no dice, and
 * no new vocabulary: **N pieces of a part become one piece of the same part, one
 * tier up.** The part never changes — five Standard pickups make an Epic pickup
 * and nothing else. A bench that turned diodes into pickups would have made
 * every part in the game one fungible currency and quietly deleted the reason
 * archetypes have different BOMs.
 *
 * ─── Why these counts ──────────────────────────────────────────────────────
 *
 * They are floored by `PART_RESALE_VALUE`, not by feel. The bin pays 1 / 3 / 8
 * Fame for Standard / Epic / Legendary, so a ratio that costs less than the
 * value it produces turns this bench into a Fame printer: at 2 Epic → 1
 * Legendary a player sells the output for 8 having spent 6, forever. Every
 * count here is checked against that in `fusion.test.ts`, and the Fame fee below
 * puts a second floor under it.
 *
 * The counts climb as the tiers thin out. Standard parts are what a stash
 * drowns in, Legendary comes off roughly a quarter of a case, so a flat ratio
 * would read as generous at the bottom and impossible at the top.
 */

/** Tiers a stack can be reworked *from*. Unique is the ceiling, never an input. */
export type FusableTier = Exclude<PartTier, "Unique">;

/** Pieces consumed per one piece produced, by the tier being consumed. */
export const FUSION_INPUT_COUNT: Record<FusableTier, number> = {
  Standard: 5,
  Epic: 4,
  Legendary: 3,
};

/**
 * Charged per piece *produced*, not per job — reworking five stacks in one
 * click costs five times this.
 *
 * Bench time, in fiction. In balance terms it is the margin that keeps the
 * cheapest step strictly lossy against the bin: five Standard parts sell for 5
 * Fame and the Epic they become sells for 3, which is already a loss, but a
 * thin one that a large enough stash could churn for free. Twenty Fame a piece
 * makes churning pointless while staying far under what the same part costs at
 * the trader's counter (12 / 35 / 450).
 */
export const FUSION_FAME_COST = 20;

/**
 * The tier a stack reworks into, or `null` when it cannot go up.
 *
 * Three parts of the roster stop short, and all three fall out of
 * `partDefinitions` rather than from a table kept in here:
 *
 *  • **Screws never rework.** They cap at Standard, so this returns `null` for
 *    them — which is load-bearing, not incidental. A teardown of the whole
 *    roster pays out 753 screws against ~100 of everything else put together,
 *    so a screw that could climb would be an unlimited supply of Unique parts.
 *  • **Pots stop at Epic**, their `maxTier`.
 *  • **Only visibly unique parts reach Unique** — body, bridge, pickup,
 *    enclosure. A neck or a diode caps at Legendary, which is also the only
 *    tier a recipe ever asks those parts for.
 */
export const getFusionOutputTier = (
  partId: PartId,
  tier: PartTier,
): PartTier | null => {
  const def = PARTS_BY_ID.get(partId);
  if (!def) return null;

  const index = PART_TIERS.indexOf(tier);
  if (index < 0) return null;

  const output = PART_TIERS[index + 1];
  if (!output) return null;

  // Unique is gated on the part being one that visibly shows, exactly as the
  // teardown gates it — a Unique tuner set is not a thing the game has.
  if (output === "Unique") return def.unique ? output : null;

  return PART_TIERS.indexOf(output) <= PART_TIERS.indexOf(def.maxTier)
    ? output
    : null;
};

/** Whether any stack of this part and tier could be reworked at all. */
export const canFuse = (partId: PartId, tier: PartTier): boolean =>
  getFusionOutputTier(partId, tier) !== null;

/** A rework job, priced. Deterministic: the same inputs always quote the same. */
export interface FusionQuote {
  partId: PartId;
  inputTier: FusableTier;
  outputTier: PartTier;
  /** Pieces consumed per piece produced. */
  ratio: number;
  /** Pieces produced. */
  crafts: number;
  /** Pieces consumed in total. */
  inputQty: number;
  /** Fame charged in total. */
  fame: number;
}

/**
 * What reworking `crafts` pieces would cost and produce, or `null` if this part
 * and tier has nowhere to go.
 *
 * Pure arithmetic — it knows nothing about a wallet. The caller measures the
 * quote against what the player is holding, which is what lets the card price a
 * job the player cannot yet afford and show them how short they are.
 */
export const getFusionQuote = (
  partId: PartId,
  tier: PartTier,
  crafts = 1,
): FusionQuote | null => {
  const outputTier = getFusionOutputTier(partId, tier);
  if (!outputTier) return null;

  const wanted = Math.floor(crafts);
  if (!Number.isFinite(wanted) || wanted <= 0) return null;

  const inputTier = tier as FusableTier;
  const ratio = FUSION_INPUT_COUNT[inputTier];

  return {
    partId,
    inputTier,
    outputTier,
    ratio,
    crafts: wanted,
    inputQty: ratio * wanted,
    fame: FUSION_FAME_COST * wanted,
  };
};

/** How many pieces of one part and tier a wallet holds. */
export const countHeldParts = (
  wallet: ScrapPart[],
  partId: PartId,
  tier: PartTier,
): number =>
  wallet
    .filter((part) => part.partId === partId && part.tier === tier)
    .reduce((total, part) => total + part.qty, 0);

/**
 * The most pieces this player could rework right now — limited by the stack, by
 * their Fame, or by the part having no tier above it.
 *
 * Both limits matter and they bind in different places: a new player is short of
 * parts, and a player who has been tearing down duplicates all week is short of
 * Fame long before they run out of Standard screws' worth of stock.
 */
export const getMaxFusionCrafts = (
  wallet: ScrapPart[],
  partId: PartId,
  tier: PartTier,
  fame: number,
): number => {
  const quote = getFusionQuote(partId, tier, 1);
  if (!quote) return 0;

  const byParts = Math.floor(
    countHeldParts(wallet, partId, tier) / quote.ratio,
  );
  const byFame = Math.floor(Math.max(0, fame) / FUSION_FAME_COST);

  return Math.max(0, Math.min(byParts, byFame));
};

/**
 * The wallet after a rework: the inputs gone, the outputs stacked onto whatever
 * the player already held at that tier.
 *
 * Merged rather than pushed, so a rework never opens a second row for a tier the
 * stash already has — the wallet is stored one row per part and tier everywhere
 * else in the game, and the stash board reads it that way.
 *
 * Assumes the quote has been measured against this wallet already
 * (`getMaxFusionCrafts`). It does not re-check, for the same reason
 * `subtractParts` does not: the caller that pays is the caller that validates.
 */
export const applyFusion = (
  wallet: ScrapPart[],
  quote: FusionQuote,
): ScrapPart[] =>
  mergeScrapParts([
    subtractParts(wallet, [
      { partId: quote.partId, tier: quote.inputTier, qty: quote.inputQty },
    ]),
    [{ partId: quote.partId, tier: quote.outputTier, qty: quote.crafts }],
  ]);
