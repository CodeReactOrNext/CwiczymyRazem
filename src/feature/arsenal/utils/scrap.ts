import { getEffectBom } from "../data/effectBom";
import { getGuitarBom } from "../data/guitarBom";
import { PART_DEFINITIONS, PART_TIERS, PARTS_BY_ID } from "../data/partDefinitions";
import { getScrapYield, mergeScrapParts } from "../data/scrapYield";
import type {
  EffectDefinition,
  EffectInventoryItem,
  GuitarDefinition,
  InventoryItem,
  PartId,
  PartTier,
  ScrapPart,
} from "../types/arsenal.types";

/**
 * What a specific guitar/pedal instance pays out when torn down. Deterministic, so
 * the collection tab can show the exact yield up front and the API can recompute
 * the same numbers server-side without trusting the client.
 */

export const getGuitarScrapYield = (
  item: Pick<InventoryItem, "features">,
  guitar: Pick<GuitarDefinition, "id" | "rarity">
): ScrapPart[] =>
  getScrapYield({
    bom: getGuitarBom(guitar.id),
    rarity: guitar.rarity,
    features: item.features,
  });

export const getEffectScrapYield = (
  item: Pick<EffectInventoryItem, "features">,
  effect: Pick<EffectDefinition, "id" | "rarity" | "type">
): ScrapPart[] =>
  getScrapYield({
    bom: getEffectBom(effect.id, effect.type),
    rarity: effect.rarity,
    features: item.features,
  });

/** Total pieces a yield contains — the headline number on the scrap button. */
export const countScrapParts = (parts: ScrapPart[]): number =>
  parts.reduce((sum, p) => sum + p.qty, 0);

/**
 * How many parts the wallet holds at each tier, rarest first. A bare grand total
 * says nothing — the split between Legendary and Standard is the actual progress.
 */
export const getWalletTierTotals = (
  wallet: ScrapPart[]
): { tier: PartTier; qty: number }[] => {
  const totals = new Map<PartTier, number>();
  for (const part of wallet) {
    if (part.qty <= 0 || !PARTS_BY_ID.has(part.partId)) continue;
    totals.set(part.tier, (totals.get(part.tier) ?? 0) + part.qty);
  }
  return [...totals.entries()]
    .map(([tier, qty]) => ({ tier, qty }))
    .sort((a, b) => PART_TIERS.indexOf(b.tier) - PART_TIERS.indexOf(a.tier));
};

/** Adds a teardown's payout to the wallet. */
export const addPartsToWallet = (wallet: ScrapPart[], gained: ScrapPart[]): ScrapPart[] =>
  mergeScrapParts([wallet, gained]);

const PART_ORDER = new Map<PartId, number>(PART_DEFINITIONS.map((p, i) => [p.id, i]));

/**
 * Wallet rows grouped by part, each carrying its per-tier counts — the shape the
 * "what do I own" panel renders.
 */
export interface WalletRow {
  partId: PartId;
  total: number;
  tiers: { tier: PartTier; qty: number }[];
}

/**
 * Wallet rows for display. Anything held over from a retired part type is skipped
 * rather than rendered as a raw id — old wallets predate the current part list.
 */
export const groupWalletByPart = (wallet: ScrapPart[]): WalletRow[] => {
  const rows = new Map<PartId, WalletRow>();
  for (const part of wallet) {
    if (part.qty <= 0 || !PARTS_BY_ID.has(part.partId)) continue;
    const row = rows.get(part.partId) ?? { partId: part.partId, total: 0, tiers: [] };
    row.total += part.qty;
    const tier = row.tiers.find((t) => t.tier === part.tier);
    if (tier) tier.qty += part.qty;
    else row.tiers.push({ tier: part.tier, qty: part.qty });
    rows.set(part.partId, row);
  }

  for (const row of rows.values()) {
    row.tiers.sort((a, b) => PART_TIERS.indexOf(b.tier) - PART_TIERS.indexOf(a.tier));
  }

  return [...rows.values()].sort(
    (a, b) => (PART_ORDER.get(a.partId) ?? 0) - (PART_ORDER.get(b.partId) ?? 0)
  );
};
