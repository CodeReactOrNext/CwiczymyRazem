import type {
  GuitarRarity,
  ItemFeature,
  PartId,
  PartTier,
  ScrapBom,
  ScrapPart,
} from "../types/arsenal.types";
import { PART_DEFINITIONS, PART_TIERS, PARTS_BY_ID } from "./partDefinitions";

/**
 * Turns an item's BOM into the parts a teardown yields.
 *
 * Fully deterministic — no dice anywhere. The same item always pays out exactly
 * the same list, so a player can read the yield off the card before committing.
 *
 * Three things shape a yield:
 *   • rarity decides *how many* slots come off (1 from junk, 4 from a Mythic)
 *   • position on the ladder decides each slot's tier, so a single teardown mixes
 *     tiers instead of paying out one flat grade
 *   • rolled features push their matching part one tier higher
 *
 * What an item does *not* physically have is handled a step earlier, in the BOM:
 * a set-neck guitar has no `neck` slot, a headless one has no `tuners`, a fuzz has
 * no `opamp`. No part type is locked behind rarity — rarity buys depth, not access.
 */

/** How many BOM slots a teardown reaches. Caps at four. */
export const RARITY_SLOT_COUNT: Record<GuitarRarity, number> = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  Epic: 3,
  Legendary: 3,
  Mythic: 4,
  "Custom Shop": 4,
};

/**
 * The tier the *first* slot comes out at. Six rarities collapse onto three part
 * tiers in pairs; later slots step down from here.
 */
export const RARITY_PART_TIER: Record<
  GuitarRarity,
  Exclude<PartTier, "Unique">
> = {
  Common: "Standard",
  Uncommon: "Standard",
  Rare: "Epic",
  Epic: "Epic",
  Legendary: "Legendary",
  Mythic: "Legendary",
  "Custom Shop": "Legendary",
};

/**
 * How far down the tier ladder each slot sits. Slots drop a tier every second
 * position, so a Legendary guitar pays out Legendary / Legendary / Epic rather
 * than three flat Legendaries — the headline parts stay special without the rest
 * of the teardown being worthless.
 */
const slotTierPenalty = (slotIndex: number): number =>
  Math.floor(slotIndex / 2);

/** Only Mythic gear yields Unique parts, and only on the parts that visibly show. */
export const UNIQUE_PART_RARITY: GuitarRarity = "Mythic";

/**
 * Screws every teardown gives up, on top of whatever the BOM pays out.
 *
 * Scaled by how deep the teardown goes, so stripping a Mythic leaves a bigger pile
 * of hardware than snapping a Common in half. These are the workshop's cheapest
 * ingredient and the one a new player has to be able to stockpile, so they stay
 * the most abundant thing in the game — but only just: at the first rate they
 * piled up faster than any recipe could spend them.
 *
 * Common 5 · Uncommon 7 · Rare–Legendary 9 · Mythic 11.
 */
export const getScrewYield = (rarity: GuitarRarity): number =>
  3 + 2 * (RARITY_SLOT_COUNT[rarity] ?? 1);

/**
 * Maps rolled instance features onto the part they physically are, so a guitar
 * that rolled `locking-tuners` yields a better tuner set. Covers both the guitar
 * (`GUITAR_FEATURES`) and pedal (`EFFECT_FEATURES`) pools — their ids don't overlap.
 * Features with no matching part (copper shielding, pro setup) upgrade nothing.
 */
export const FEATURE_PART_UPGRADES: Record<string, PartId> = {
  // Pedal features
  "nos-opamp": "opamp",
  "germanium-diodes": "diode",
  "asym-clipping": "diode",
  "led-clipping": "diode",
  "mosfet-clipping": "diode",
  "trim-pots": "pot",
  shielding: "enclosure",
  // Guitar features
  "hand-wound": "pickup",
  "active-preamp": "pickup",
  "coil-split": "pot",
  "push-pull": "pot",
  "cts-pots": "pot",
  "phase-switch": "pot",
  "treble-bleed": "pot",
  "pio-caps": "pot",
  "brass-trem-block": "bridge",
  "steel-saddles": "bridge",
  "locking-tuners": "tuners",
  "torrefied-wood": "body",
  "chambered-body": "body",
  "rolled-edges": "neck",
  "compound-radius": "neck",
  "graphite-neck": "neck",
  "satin-neck": "neck",
  "truss-wheel": "neck",
};

export interface ScrapInput {
  bom: ScrapBom;
  rarity: GuitarRarity;
  /** Features rolled on this specific instance. */
  features?: ItemFeature[];
}

const PART_ORDER = new Map<PartId, number>(
  PART_DEFINITIONS.map((p, i) => [p.id, i]),
);

/** Which parts this instance's features push one tier up. */
export const getUpgradedParts = (features: ItemFeature[] = []): Set<PartId> => {
  const upgraded = new Set<PartId>();
  for (const f of features) {
    const partId = FEATURE_PART_UPGRADES[f.id];
    if (partId) upgraded.add(partId);
  }
  return upgraded;
};

export const getScrapYield = ({
  bom,
  rarity,
  features,
}: ScrapInput): ScrapPart[] => {
  const slotCount = RARITY_SLOT_COUNT[rarity] ?? 1;
  const baseTierIndex = PART_TIERS.indexOf(
    RARITY_PART_TIER[rarity] ?? "Standard",
  );
  const upgraded = getUpgradedParts(features);

  // Kept in BOM order — the headline part reads first in the tooltip.
  const parts: ScrapPart[] = [];

  for (let slot = 0; slot < bom.length && slot < slotCount; slot++) {
    const { partId, qty } = bom[slot];
    const def = PARTS_BY_ID.get(partId);
    if (!def || qty <= 0) continue;

    let tier: PartTier;
    if (def.unique && rarity === UNIQUE_PART_RARITY) {
      tier = "Unique";
    } else {
      const bump = upgraded.has(partId) ? 1 : 0;
      const maxTierIndex = PART_TIERS.indexOf(def.maxTier);
      const index = baseTierIndex - slotTierPenalty(slot) + bump;
      tier = PART_TIERS[Math.min(Math.max(index, 0), maxTierIndex)];
    }

    parts.push({ partId, tier, qty });
  }

  // Screws come off *everything*, so they are handed out on top of the BOM rather
  // than competing for a slot in it. Only four BOMs in the game list them, which
  // left screws scarcer than pickups — the exact opposite of what filler should be,
  // and unusable as the workshop's entry-level ingredient. This also covers the
  // defensive case of a BOM authored empty: a teardown always pays out something.
  const bonus = getScrewYield(rarity);
  const screwRow = parts.find((p) => p.partId === "screws");
  if (screwRow) screwRow.qty += bonus;
  else parts.push({ partId: "screws", tier: "Standard", qty: bonus });

  return parts;
};

/**
 * Folds several yields into one list — used when scrapping in bulk and when adding
 * a payout to the wallet.
 *
 * Parts that no longer exist in `PART_DEFINITIONS` are dropped: this is the single
 * funnel every wallet write goes through, so retired part types clean themselves
 * out of stored wallets the next time a player scraps anything.
 */
export const mergeScrapParts = (yields: ScrapPart[][]): ScrapPart[] => {
  const tally = new Map<string, ScrapPart>();
  for (const parts of yields) {
    for (const part of parts) {
      if (!PARTS_BY_ID.has(part.partId)) continue;
      const key = `${part.partId}:${part.tier}`;
      const existing = tally.get(key);
      if (existing) existing.qty += part.qty;
      else tally.set(key, { ...part });
    }
  }
  return [...tally.values()].sort(
    (a, b) =>
      (PART_ORDER.get(a.partId) ?? 0) - (PART_ORDER.get(b.partId) ?? 0) ||
      PART_TIERS.indexOf(b.tier) - PART_TIERS.indexOf(a.tier),
  );
};
