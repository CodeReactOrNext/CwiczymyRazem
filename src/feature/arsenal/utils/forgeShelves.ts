import { PART_DEFINITIONS, PART_TIERS } from "../data/partDefinitions";
import type { PartId, PartTier, ScrapPart } from "../types/arsenal.types";
import type { TierProgress } from "./workshopReadiness";
import { getTierProgress } from "./workshopReadiness";

/** Which teardown a shelf holds — the same split `partDefinitions` makes. */
export type ForgeGroup = "guitar" | "pedal" | "shared";

export const FORGE_GROUPS: ForgeGroup[] = ["guitar", "pedal", "shared"];

export interface ForgeStack {
  partId: PartId;
  tier: PartTier;
  /** 0 for a tier the player does not hold — drawn grey, as a place on the ladder. */
  qty: number;
  /** The way to the next tier; null for a part that cannot climb or a tier not held. */
  progress: TierProgress | null;
}

export interface ForgeShelf {
  partId: PartId;
  /** Every tier the part comes in, lowest first — the ladder the anvil climbs. */
  stacks: ForgeStack[];
}

export interface ForgeSection {
  group: ForgeGroup;
  shelves: ForgeShelf[];
  /** Stacks in this section that could be reworked right now. */
  ready: number;
}

/**
 * The tiers a part comes in: up to its `maxTier`, and Unique on top for the
 * parts that visibly show — the same rule the teardown and the rework follow.
 */
export const getPartTierLadder = (partId: PartId): PartTier[] => {
  const def = PART_DEFINITIONS.find((p) => p.id === partId);
  if (!def) return [];
  const ladder = PART_TIERS.slice(0, PART_TIERS.indexOf(def.maxTier) + 1);
  return def.unique ? [...ladder, "Unique"] : ladder;
};

const heldQty = (wallet: ScrapPart[], partId: PartId, tier: PartTier) =>
  wallet
    .filter((p) => p.partId === partId && p.tier === tier)
    .reduce((sum, p) => sum + Math.max(0, p.qty), 0);

/**
 * The whole roster laid out for the anvil: one section per teardown, one shelf
 * per part, one plate per tier the part comes in — held or not. A tier the
 * player has none of is still on the shelf, grey, so the shelf reads as the
 * ladder it is: what you have, and what you could make next.
 *
 * `onlyReady` drops every shelf without a stack that can be reworked now, and a
 * section left with no shelves goes with them — the filter answers "what can I
 * make", so an empty heading would only be noise.
 */
export const getForgeSections = (
  wallet: ScrapPart[],
  fame: number,
  onlyReady = false,
): ForgeSection[] =>
  FORGE_GROUPS.map((group) => {
    const shelves = PART_DEFINITIONS.filter((def) => def.group === group).map(
      (def): ForgeShelf => ({
        partId: def.id,
        stacks: getPartTierLadder(def.id).map((tier) => {
          const qty = heldQty(wallet, def.id, tier);
          return {
            partId: def.id,
            tier,
            qty,
            progress:
              qty > 0
                ? getTierProgress({ partId: def.id, tier, qty }, fame)
                : null,
          };
        }),
      }),
    );

    const ready = shelves.reduce(
      (sum, shelf) =>
        sum + shelf.stacks.filter((s) => s.progress?.ready).length,
      0,
    );

    return {
      group,
      ready,
      shelves: onlyReady
        ? shelves.filter((shelf) => shelf.stacks.some((s) => s.progress?.ready))
        : shelves,
    };
  }).filter((section) => section.shelves.length > 0);

/** How many stacks in the bin could go on the anvil and be reworked right now. */
export const countReadyStacks = (wallet: ScrapPart[], fame: number): number =>
  getForgeSections(wallet, fame).reduce((sum, s) => sum + s.ready, 0);
