import {
  PART_DEFINITIONS,
  PART_TIERS,
  PARTS_BY_ID,
} from "feature/arsenal/data/partDefinitions";
import type {
  EffectType,
  GuitarRarity,
  PartId,
  PartTier,
} from "feature/arsenal/types/arsenal.types";
import type {
  GearKind,
  ProposalStatus,
  ProposedScrapSlot,
} from "feature/gearProposals/types/gearProposal.types";
import {
  GEAR_KINDS,
  PROPOSABLE_RARITIES,
  PROPOSAL_STATUSES,
} from "feature/gearProposals/types/gearProposal.types";

export const GEAR_NAME_MAX = 40;
export const GEAR_BRAND_MAX = 30;
export const GEAR_DESCRIPTION_MAX = 500;

/**
 * An engraving is a line on a headstock, not a paragraph. The cap is what keeps
 * it something a person reads in one glance on the item card — and it is the
 * reason the field is worth having at all.
 */
export const GEAR_INSCRIPTION_MAX = 60;

export const isGearKind = (value: unknown): value is GearKind =>
  GEAR_KINDS.includes(value as GearKind);

export const isProposableRarity = (value: unknown): value is GuitarRarity =>
  PROPOSABLE_RARITIES.includes(value as GuitarRarity);

export const isProposalStatus = (value: unknown): value is ProposalStatus =>
  PROPOSAL_STATUSES.includes(value as ProposalStatus);

/**
 * Image links are typed in by hand and rendered straight onto the board, so the
 * scheme is the whole security story: `https:` only. `javascript:` would be a
 * script, `data:` a payload of unbounded size, and plain `http:` breaks the
 * page's own security context on load. Anything unparseable is simply dropped
 * rather than rejected — a broken link should not cost someone their tokens.
 */
export const safeImageUrl = (value: unknown): string | null => {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed).protocol === "https:" ? trimmed : null;
  } catch {
    return null;
  }
};

/** Only a pedal has an effect type; a guitar carrying one would be nonsense. */
export const effectTypeFor = (
  kind: GearKind,
  value: unknown,
  known: readonly EffectType[],
): EffectType | null =>
  kind === "effect" && known.includes(value as EffectType)
    ? (value as EffectType)
    : null;

/** A teardown long enough to be interesting, short enough to stay readable. */
export const MAX_SCRAP_SLOTS = 5;
export const MAX_SCRAP_QTY = 3;

/**
 * Parts this kind of gear can actually yield. A pedal has no neck and a guitar
 * has no op-amp, so the picker is filtered by the part's own group rather than
 * letting someone propose a physically impossible teardown.
 */
export const partsForKind = (kind: GearKind) =>
  PART_DEFINITIONS.filter(
    (part) =>
      part.group === "shared" ||
      part.group === (kind === "guitar" ? "guitar" : "pedal"),
  );

export const DEFAULT_SCRAP_TIER: PartTier = "Standard";

/**
 * Grades a part can actually come off at.
 *
 * The ceiling is the part's own — nobody brags about a legendary screw — and
 * `Unique` sits above that ceiling rather than under it, reachable only by the
 * parts the Arsenal marks as visually meaningful. Asking for a grade a part
 * cannot hold would be proposing an item the bench could never build.
 */
export const tiersForPart = (partId: PartId): PartTier[] => {
  const part = PARTS_BY_ID.get(partId);
  if (!part) return [DEFAULT_SCRAP_TIER];

  const upToCeiling = PART_TIERS.slice(
    0,
    PART_TIERS.indexOf(part.maxTier) + 1,
  ).filter((tier) => tier !== "Unique");

  return part.unique ? [...upToCeiling, "Unique"] : upToCeiling;
};

const safeTier = (partId: PartId, value: unknown): PartTier => {
  const allowed = tiersForPart(partId);
  return allowed.includes(value as PartTier)
    ? (value as PartTier)
    : DEFAULT_SCRAP_TIER;
};

/**
 * Cleans a proposed teardown: known parts only, ones that fit this kind of
 * gear, sane quantities, a grade each part can actually hold, no duplicate
 * slots, and capped in length. Order is preserved because order is the salvage
 * priority.
 */
export const sanitizeScrapBom = (
  kind: GearKind,
  slots: unknown,
): ProposedScrapSlot[] => {
  if (!Array.isArray(slots)) return [];

  const allowed = new Set(partsForKind(kind).map((part) => part.id));
  const seen = new Set<PartId>();

  return slots
    .filter(
      (slot): slot is { partId: PartId; qty?: unknown; tier?: unknown } =>
        !!slot && allowed.has((slot as { partId: PartId }).partId),
    )
    .filter((slot) => {
      if (seen.has(slot.partId)) return false;
      seen.add(slot.partId);
      return true;
    })
    .slice(0, MAX_SCRAP_SLOTS)
    .map((slot) => ({
      partId: slot.partId,
      qty: Math.min(
        MAX_SCRAP_QTY,
        Math.max(1, Math.floor(Number(slot.qty) || 1)),
      ),
      tier: safeTier(slot.partId, slot.tier),
    }));
};

/** Most backed first; a tie goes to whoever proposed it first. */
export const rankProposals = <
  T extends { voteCount: number; createdAt: string },
>(
  proposals: T[],
): T[] =>
  [...proposals].sort(
    (a, b) =>
      b.voteCount - a.voteCount || a.createdAt.localeCompare(b.createdAt),
  );
