import type {
  EffectDefinition,
  EffectInventoryItem,
  GuitarDefinition,
  GuitarRarity,
  InventoryItem,
  PartId,
  PartTier,
  ScrapBom,
  ScrapPart,
  WorkshopKind,
} from "../types/arsenal.types";
import { getEffectBom } from "./effectBom";
import { EFFECT_FEATURES } from "./effectStats";
import { getGuitarBom } from "./guitarBom";
import type { ConditionKey } from "./itemStats";
import {
  CONDITION_GRADES,
  getConditionGrade,
  getItemCondition,
  GUITAR_FEATURES,
  RARITY_BUILD_GAIN,
} from "./itemStats";
import { PART_DEFINITIONS, PART_TIERS, PARTS_BY_ID } from "./partDefinitions";
import { FEATURE_PART_UPGRADES, mergeScrapParts } from "./scrapYield";

/**
 * The workshop: the crafting half of the scrap loop.
 *
 * There is **no level cap**. Progression is gated by a cost curve instead — every
 * further build level wants more parts, rarer parts, and more *different* parts at
 * once. The wall is emergent (at some point the next level simply is not worth the
 * teardowns) rather than written down, which means a determined player can always
 * push one more level.
 *
 * Everything here is deterministic, like `scrapYield.ts`: the player sees the exact
 * bill before committing and the API recomputes the identical numbers server-side,
 * so nothing has to be trusted from the client.
 */

export type { WorkshopKind };

// ─── Part Points — the common currency of every workshop job ─────────────────

/** What one piece of a part is worth when paying for a job. */
export const PART_TIER_PP: Record<PartTier, number> = {
  Standard: 1,
  Epic: 4,
  Legendary: 12,
  Unique: 40,
};

export const getPartPP = (part: ScrapPart): number =>
  (PART_TIER_PP[part.tier] ?? 0) * part.qty;

/** Part Points held in a wallet, counting only pieces a given job may spend. */
export const countPP = (parts: ScrapPart[]): number =>
  parts.reduce((sum, p) => sum + getPartPP(p), 0);

// ─── The build curve ─────────────────────────────────────────────────────────

const BUILD_BASE_PP = 6;
const BUILD_GROWTH = 1.35;

/** Fame charged per build level — a second axis that grows with the same slope. */
export const BUILD_FAME_PER_LEVEL = 10;

/**
 * Part Points to buy build level `level`. Geometric, so the gain (flat, linear)
 * falls behind the price fast — that curve *is* the level cap.
 */
export const getBuildPPCost = (level: number): number =>
  Math.ceil(BUILD_BASE_PP * Math.pow(BUILD_GROWTH, Math.max(1, level) - 1));

export const getBuildFameCost = (level: number): number =>
  BUILD_FAME_PER_LEVEL * Math.max(1, level);

/** Unique parts demanded from level 19 up, then one more every 7 levels. Uncapped. */
export const getBuildUniqueCost = (level: number): number =>
  Math.max(0, Math.floor((level - 12) / 7));

interface BuildBand {
  /** Highest build level this band covers. */
  upTo: number;
  /** Distinct BOM parts the payment must include. `Infinity` = the whole BOM. */
  distinct: number;
  /** No piece below this tier is accepted. */
  minTier: PartTier;
  /** The item has to be in at least this condition first. */
  condition: ConditionKey;
}

/**
 * Requirements widen in bands rather than every level, so a player can see the
 * next wall coming and stockpile for it.
 */
const BUILD_BANDS: BuildBand[] = [
  { upTo: 3, distinct: 1, minTier: "Standard", condition: "Good" },
  { upTo: 7, distinct: 2, minTier: "Standard", condition: "Good" },
  { upTo: 12, distinct: 3, minTier: "Epic", condition: "Mint" },
  { upTo: 18, distinct: Infinity, minTier: "Epic", condition: "Mint" },
  { upTo: 25, distinct: Infinity, minTier: "Legendary", condition: "Museum" },
  {
    upTo: Infinity,
    distinct: Infinity,
    minTier: "Legendary",
    condition: "Museum",
  },
];

export interface BuildRequirement {
  /** The level being bought (current build level + 1). */
  level: number;
  pp: number;
  fame: number;
  /** How many different BOM parts must appear in the payment. */
  distinctParts: number;
  minTier: PartTier;
  uniqueParts: number;
  condition: ConditionKey;
}

export const getBuildRequirement = (
  level: number,
  bomPartCount: number,
): BuildRequirement => {
  const band =
    BUILD_BANDS.find((b) => level <= b.upTo) ??
    BUILD_BANDS[BUILD_BANDS.length - 1];
  return {
    level,
    pp: getBuildPPCost(level),
    fame: getBuildFameCost(level),
    distinctParts: Math.min(band.distinct, bomPartCount),
    minTier: band.minTier,
    uniqueParts: getBuildUniqueCost(level),
    condition: band.condition,
  };
};

// ─── Repair (condition) ──────────────────────────────────────────────────────

/**
 * Condition stays a bounded 0–1 physical state — it feeds `getItemValue` and the
 * market, so stretching it past Museum would break pricing. It is not a cap on
 * progression though: it is the *gate* the build bands keep raising.
 */
const REPAIR_STEPS: { key: ConditionKey; to: number; rate: number }[] = [
  { key: "Worn", to: 0.18, rate: 0.12 },
  { key: "Good", to: 0.43, rate: 0.2 },
  { key: "Mint", to: 0.73, rate: 0.4 },
  { key: "Museum", to: 0.95, rate: 1 },
];

/** Repairing a Mythic is four times the work of repairing a Common. */
export const REPAIR_RARITY_MULT: Record<GuitarRarity, number> = {
  Common: 1,
  Uncommon: 1.2,
  Rare: 1.5,
  Epic: 2,
  Legendary: 3,
  Mythic: 4,
};

// ─── Condition helpers ───────────────────────────────────────────────────────

/** Rank of a condition grade: Relic = 1 … Museum = 5. */
export const getConditionRank = (key: ConditionKey): number =>
  CONDITION_GRADES.length - CONDITION_GRADES.findIndex((g) => g.key === key);

/** The grade sitting at a given rank — turns a check's progress back into a label. */
export const getGradeByRank = (rank: number) =>
  CONDITION_GRADES[CONDITION_GRADES.length - rank] ??
  CONDITION_GRADES[CONDITION_GRADES.length - 1];

// ─── Subjects — one shape for both guitars and pedals ────────────────────────

export interface WorkshopSubject {
  id: string;
  kind: WorkshopKind;
  name: string;
  rarity: GuitarRarity;
  buildLevel: number;
  condition: number;
  bom: ScrapBom;
}

export const getGuitarSubject = (
  item: Pick<InventoryItem, "id" | "condition" | "buildLevel">,
  guitar: Pick<GuitarDefinition, "id" | "name" | "rarity">,
): WorkshopSubject => ({
  id: item.id,
  kind: "guitar",
  name: guitar.name,
  rarity: guitar.rarity,
  buildLevel: item.buildLevel ?? 0,
  condition: getItemCondition(item),
  bom: getGuitarBom(guitar.id),
});

export const getEffectSubject = (
  item: Pick<EffectInventoryItem, "id" | "condition" | "buildLevel">,
  effect: Pick<EffectDefinition, "id" | "name" | "rarity" | "type">,
): WorkshopSubject => ({
  id: item.id,
  kind: "effect",
  name: effect.name,
  rarity: effect.rarity,
  buildLevel: item.buildLevel ?? 0,
  condition: getItemCondition(item),
  bom: getEffectBom(effect.id, effect.type),
});

/** Distinct part types in the subject's BOM, in salvage order. */
export const getBomParts = (bom: ScrapBom): PartId[] => {
  const seen: PartId[] = [];
  for (const slot of bom) {
    if (PARTS_BY_ID.has(slot.partId) && !seen.includes(slot.partId))
      seen.push(slot.partId);
  }
  return seen;
};

/** A guitar cannot be rebuilt out of op-amps: only its own half of the wallet counts. */
const isPartUsableBy = (partId: PartId, kind: WorkshopKind): boolean => {
  const group = PARTS_BY_ID.get(partId)?.group;
  if (!group) return false;
  return (
    group === "shared" ||
    (kind === "guitar" ? group === "guitar" : group === "pedal")
  );
};

// ─── The payment planner ─────────────────────────────────────────────────────

export interface WorkshopPayment {
  /** Exactly what the job consumes. */
  parts: ScrapPart[];
  /** Part Points delivered — at or just above what was asked for. */
  pp: number;
}

interface PaymentRequest {
  wallet: ScrapPart[];
  kind: WorkshopKind;
  minTier: PartTier;
  pp: number;
  distinctParts: number;
  bomParts: PartId[];
  uniqueParts: number;
}

const PART_ORDER = new Map<PartId, number>(
  PART_DEFINITIONS.map((p, i) => [p.id, i]),
);

interface PoolEntry {
  partId: PartId;
  tier: PartTier;
  left: number;
  value: number;
}

/** Spendable stock for a job, cheapest piece first so pricey parts survive. */
const buildPool = (
  wallet: ScrapPart[],
  kind: WorkshopKind,
  minTier: PartTier,
): PoolEntry[] => {
  const minIndex = PART_TIERS.indexOf(minTier);
  return wallet
    .filter(
      (p) =>
        p.qty > 0 &&
        PARTS_BY_ID.has(p.partId) &&
        isPartUsableBy(p.partId, kind) &&
        PART_TIERS.indexOf(p.tier) >= minIndex,
    )
    .map((p) => ({
      partId: p.partId,
      tier: p.tier,
      left: p.qty,
      value: PART_TIER_PP[p.tier] ?? 0,
    }))
    .sort(
      (a, b) =>
        a.value - b.value ||
        (PART_ORDER.get(a.partId) ?? 0) - (PART_ORDER.get(b.partId) ?? 0),
    );
};

/**
 * Picks the exact parts a job consumes.
 *
 * Cheapest-first everywhere, which keeps two promises at once: the bill never
 * burns a Legendary where two Standards would do, and Unique parts — the scarcest
 * thing in the game — are only ever touched when a level explicitly demands them.
 *
 * Returns `null` when the wallet cannot cover the job; the caller has already
 * reported *why* through `getWorkshopChecks`.
 */
export const planPayment = (req: PaymentRequest): WorkshopPayment | null => {
  const pool = buildPool(req.wallet, req.kind, req.minTier);
  const taken = new Map<string, ScrapPart>();
  let pp = 0;

  const take = (entry: PoolEntry, qty: number) => {
    const n = Math.min(qty, entry.left);
    if (n <= 0) return;
    entry.left -= n;
    pp += n * entry.value;
    const key = `${entry.partId}:${entry.tier}`;
    const existing = taken.get(key);
    if (existing) existing.qty += n;
    else taken.set(key, { partId: entry.partId, tier: entry.tier, qty: n });
  };

  // 1. One piece of each required BOM part — the "assembly" half of the recipe.
  let covered = 0;
  for (const partId of req.bomParts) {
    if (covered >= req.distinctParts) break;
    const entry = pool.find((e) => e.partId === partId && e.left > 0);
    if (!entry) continue;
    take(entry, 1);
    covered++;
  }
  if (covered < req.distinctParts) return null;

  // 2. Unique parts, on top of whatever step 1 happened to grab.
  if (req.uniqueParts > 0) {
    let uniques = [...taken.values()]
      .filter((p) => p.tier === "Unique")
      .reduce((sum, p) => sum + p.qty, 0);
    for (const entry of pool) {
      if (uniques >= req.uniqueParts) break;
      if (entry.tier !== "Unique" || entry.left <= 0) continue;
      const need = req.uniqueParts - uniques;
      const n = Math.min(need, entry.left);
      take(entry, n);
      uniques += n;
    }
    if (uniques < req.uniqueParts) return null;
  }

  // 3. Top up to the Part Points price with the cheapest stock left.
  for (const entry of pool) {
    if (pp >= req.pp) break;
    if (entry.left <= 0 || entry.value <= 0) continue;
    take(entry, Math.ceil((req.pp - pp) / entry.value));
  }
  if (pp < req.pp) return null;

  return { parts: [...taken.values()], pp };
};

/** Removes a payment from the wallet. Mirrors `addPartsToWallet` in `utils/scrap`. */
export const subtractParts = (
  wallet: ScrapPart[],
  spent: ScrapPart[],
): ScrapPart[] => {
  const remaining = mergeScrapParts([wallet]).map((p) => ({ ...p }));
  for (const part of spent) {
    const row = remaining.find(
      (p) => p.partId === part.partId && p.tier === part.tier,
    );
    if (row) row.qty -= part.qty;
  }
  return remaining.filter((p) => p.qty > 0);
};

// ─── Quotes — everything the UI and the API need about one job ───────────────

export type WorkshopCheckKind =
  | "condition"
  | "parts"
  | "distinct"
  | "unique"
  | "fame";

/** One requirement line, always with progress so the UI can show how close it is. */
export interface WorkshopCheck {
  kind: WorkshopCheckKind;
  label: string;
  current: number;
  required: number;
  ok: boolean;
  detail?: string;
}

// ─── Build log flavour ───────────────────────────────────────────────────────

/**
 * `FEATURE_PART_UPGRADES` already says which part each named feature physically is.
 * Read backwards it says what a part can be fitted as, which is exactly the label a
 * build job needs — so a job paid with a bridge reads "Brass trem block", not "+1".
 */
const FEATURES_BY_PART = ((): Map<PartId, string[]> => {
  const map = new Map<PartId, string[]>();
  for (const [featureId, partId] of Object.entries(FEATURE_PART_UPGRADES)) {
    map.set(partId, [...(map.get(partId) ?? []), featureId]);
  }
  return map;
})();

const GUITAR_FEATURE_LABELS = new Map(
  GUITAR_FEATURES.map((f) => [f.id, f.label]),
);
const EFFECT_FEATURE_LABELS = new Map(
  EFFECT_FEATURES.map((f) => [f.id, f.label]),
);

const getBuildModName = (
  payment: WorkshopPayment | null,
  kind: WorkshopKind,
  level: number,
): string => {
  const labels =
    kind === "guitar" ? GUITAR_FEATURE_LABELS : EFFECT_FEATURE_LABELS;

  // The most expensive piece in the bill is the one worth naming the job after.
  const headline = [...(payment?.parts ?? [])].sort(
    (a, b) => (PART_TIER_PP[b.tier] ?? 0) - (PART_TIER_PP[a.tier] ?? 0),
  );

  for (const part of headline) {
    const candidates = (FEATURES_BY_PART.get(part.partId) ?? []).filter((id) =>
      labels.has(id),
    );
    if (candidates.length > 0) {
      return labels.get(candidates[level % candidates.length])!;
    }
  }

  return "Bench work";
};

export interface BuildQuote {
  requirement: BuildRequirement;
  /** Item Level this level adds — flat per rarity, forever. */
  gain: number;
  bomParts: PartId[];
  checks: WorkshopCheck[];
  canBuild: boolean;
  payment: WorkshopPayment | null;
  /** Name of the mod this job fits, for the build log. */
  modName: string;
}

export const getBuildQuote = (
  subject: WorkshopSubject,
  wallet: ScrapPart[],
  fame: number,
): BuildQuote => {
  const level = subject.buildLevel + 1;
  const bomParts = getBomParts(subject.bom);
  const requirement = getBuildRequirement(level, bomParts.length);
  const pool = buildPool(wallet, subject.kind, requirement.minTier);

  const availablePP = pool.reduce((sum, e) => sum + e.left * e.value, 0);
  const availableDistinct = bomParts.filter((id) =>
    pool.some((e) => e.partId === id && e.left > 0),
  ).length;
  const availableUnique = pool
    .filter((e) => e.tier === "Unique")
    .reduce((sum, e) => sum + e.left, 0);

  const conditionRank = getConditionRank(
    getConditionGrade(subject.condition).key,
  );
  const requiredRank = getConditionRank(requirement.condition);

  const checks: WorkshopCheck[] = [
    {
      kind: "condition",
      label: "Condition",
      current: conditionRank,
      required: requiredRank,
      ok: conditionRank >= requiredRank,
      detail: requirement.condition,
    },
    {
      kind: "parts",
      label: `${requirement.minTier}+ parts`,
      current: availablePP,
      required: requirement.pp,
      ok: availablePP >= requirement.pp,
      detail: `${requirement.pp} pp`,
    },
    {
      kind: "distinct",
      label: "Different parts",
      current: availableDistinct,
      required: requirement.distinctParts,
      ok: availableDistinct >= requirement.distinctParts,
    },
  ];

  if (requirement.uniqueParts > 0) {
    checks.push({
      kind: "unique",
      label: "Unique parts",
      current: availableUnique,
      required: requirement.uniqueParts,
      ok: availableUnique >= requirement.uniqueParts,
    });
  }

  checks.push({
    kind: "fame",
    label: "Fame",
    current: fame,
    required: requirement.fame,
    ok: fame >= requirement.fame,
  });

  const canBuild = checks.every((c) => c.ok);
  const payment = canBuild
    ? planPayment({
        wallet,
        kind: subject.kind,
        minTier: requirement.minTier,
        pp: requirement.pp,
        distinctParts: requirement.distinctParts,
        bomParts,
        uniqueParts: requirement.uniqueParts,
      })
    : null;

  return {
    requirement,
    gain: RARITY_BUILD_GAIN[subject.rarity] ?? 1,
    bomParts,
    checks,
    canBuild: canBuild && payment !== null,
    payment,
    modName: getBuildModName(payment, subject.kind, level),
  };
};

export interface RepairQuote {
  /** `null` once the item is already Museum grade. */
  target: ConditionKey | null;
  fromCondition: number;
  toCondition: number;
  pp: number;
  /** Item Level the step is worth (condition contributes 0–10). */
  gain: number;
  checks: WorkshopCheck[];
  canRepair: boolean;
  payment: WorkshopPayment | null;
}

export const getRepairQuote = (
  subject: WorkshopSubject,
  wallet: ScrapPart[],
): RepairQuote => {
  const step = REPAIR_STEPS.find((s) => s.to > subject.condition);

  if (!step) {
    return {
      target: null,
      fromCondition: subject.condition,
      toCondition: subject.condition,
      pp: 0,
      gain: 0,
      checks: [],
      canRepair: false,
      payment: null,
    };
  }

  const mult = REPAIR_RARITY_MULT[subject.rarity] ?? 1;
  const pp = Math.max(
    1,
    Math.ceil((step.to - subject.condition) * 100 * step.rate * mult),
  );

  const pool = buildPool(wallet, subject.kind, "Standard");
  const availablePP = pool.reduce((sum, e) => sum + e.left * e.value, 0);

  const checks: WorkshopCheck[] = [
    {
      kind: "parts",
      label: "Any parts",
      current: availablePP,
      required: pp,
      ok: availablePP >= pp,
      detail: `${pp} pp`,
    },
  ];

  const payment =
    availablePP >= pp
      ? planPayment({
          wallet,
          kind: subject.kind,
          minTier: "Standard",
          pp,
          distinctParts: 0,
          bomParts: [],
          uniqueParts: 0,
        })
      : null;

  return {
    target: step.key,
    fromCondition: subject.condition,
    toCondition: step.to,
    pp,
    gain: Math.round(step.to * 10) - Math.round(subject.condition * 10),
    checks,
    canRepair: payment !== null,
    payment,
  };
};
