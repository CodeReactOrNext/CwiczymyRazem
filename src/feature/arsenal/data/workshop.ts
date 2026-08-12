import type {
  EffectDefinition,
  EffectInventoryItem,
  EffectType,
  GuitarDefinition,
  GuitarRarity,
  InventoryItem,
  ItemFeature,
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
  BUILDS_PER_PROMOTION,
  CONDITION_GRADES,
  getConditionGrade,
  getEffectiveRarity,
  getItemCondition,
  getPromotionsAvailable,
  GUITAR_FEATURES,
  RARITY_BUILD_GAIN,
  RARITY_LADDER,
  RARITY_LEVEL_BONUS,
  RARITY_MAX_FEATURES,
} from "./itemStats";
import { PARTS_BY_ID } from "./partDefinitions";
import { getPartSupply, SUPPLY_RANK_TIER } from "./partSupply";
import { FEATURE_PART_UPGRADES, mergeScrapParts } from "./scrapYield";

/**
 * The workshop: the crafting half of the scrap loop.
 *
 * Nine build levels, and every third one promotes the item a rarity up — three
 * promotions at most, and never past `Custom Shop`, the tier no case can drop.
 * Where an item *lands* depends on where it started: only Epic and above can reach
 * Custom Shop, while a Common runs out of promotions at Epic, an Uncommon at
 * Legendary and a Rare at Mythic. Levels carry on past nine for players with parts
 * to burn, but they only add level: the rarity ladder is finite, the level grind
 * is not.
 *
 * **Every job has one fixed recipe.** A level asks for named parts in named
 * quantities — "16 screws and 4 bodies" — never for a value the wallet can settle
 * however it likes. A bill that reshuffles itself depending on what happens to be
 * in stock is impossible to plan around and reads as random, so the recipe is
 * derived only from the item's own BOM and the level, and is identical every time.
 *
 * Everything here is deterministic, like `scrapYield.ts`: the player sees the exact
 * bill before committing and the API recomputes the identical numbers server-side,
 * so nothing has to be trusted from the client.
 */

export type { WorkshopKind };

// ─── Recipes ─────────────────────────────────────────────────────────────────

/** Where a recipe slot draws its part from, once resolved against a real item. */
type RecipeSource =
  /**
   * The n-th BOM part that can reach any tier (never a pot or a screw), ordered
   * by how much of it the drop tables actually supply — see `getStructuralParts`.
   */
  | { kind: "structural"; index: number }
  /** The first BOM part that can roll Unique — every BOM has exactly one. */
  | { kind: "unique" }
  /** A named shared part, for filler that should not depend on the item. */
  | { kind: "fixed"; partId: PartId };

interface RecipeSlot {
  source: RecipeSource;
  tier: PartTier;
  qty: number;
}

const structural = (
  index: number,
  tier: PartTier,
  qty: number,
): RecipeSlot => ({
  source: { kind: "structural", index },
  tier,
  qty,
});

const unique = (qty: number): RecipeSlot => ({
  source: { kind: "unique" },
  tier: "Unique",
  qty,
});

const fixed = (partId: PartId, tier: PartTier, qty: number): RecipeSlot => ({
  source: { kind: "fixed", partId },
  tier,
  qty,
});

/** One line of a resolved recipe, with the player's stock against it. */
export interface RecipeLine {
  partId: PartId;
  tier: PartTier;
  need: number;
  have: number;
  ok: boolean;
}

// ─── The build ladder ────────────────────────────────────────────────────────

interface BuildStep {
  slots: RecipeSlot[];
  /** The item has to be in at least this condition first. */
  condition: ConditionKey;
}

/**
 * Nine levels in three flights of three; every third one promotes.
 *
 * Quantities climb inside a flight and the tier steps up between flights, so the
 * wall a player hits is "I need Legendary pickups now", not an abstract total.
 * Only the first two *structural* BOM parts are ever asked for at Legendary —
 * every BOM in the game has at least two, so no recipe can be impossible.
 *
 * **The quantities are set by what the drop tables can supply, not by feel.** A
 * Legendary part comes off one teardown of a Legendary or Mythic item, and those
 * land a few percent of the time on a case costing hundreds of Fame — so a slot
 * asking for sixteen of them is not a grind, it is a wall no player reaches in a
 * lifetime of practice. Read every number here as "this many *teardowns*", because
 * at the top tiers that is exactly what it is. Anything above single digits at
 * Legendary, or a handful at Unique, prices the level out of the game.
 *
 * No Epic filler either: the only part that could carry it is the pot, which caps
 * at Epic and sits deep in every BOM, making Epic pots scarcer than Legendary
 * pickups. Filler stays at Standard or it is not filler.
 */
const BUILD_LADDER: BuildStep[] = [
  // ─── First flight ─── scrap-drawer work.
  {
    condition: "Good",
    slots: [structural(0, "Standard", 2), fixed("screws", "Standard", 6)],
  },
  {
    condition: "Good",
    slots: [
      structural(0, "Standard", 4),
      structural(1, "Standard", 2),
      fixed("screws", "Standard", 10),
    ],
  },
  {
    // ★ promotion
    condition: "Mint",
    slots: [structural(0, "Epic", 2), structural(1, "Epic", 2), unique(1)],
  },
  // ─── Second flight ─── the wallet starts to hurt.
  {
    condition: "Mint",
    slots: [structural(0, "Epic", 3), structural(1, "Epic", 2)],
  },
  {
    condition: "Mint",
    slots: [structural(0, "Epic", 4), structural(1, "Epic", 3)],
  },
  {
    // ★ promotion
    condition: "Mint",
    slots: [
      structural(0, "Legendary", 2),
      structural(1, "Legendary", 1),
      unique(2),
    ],
  },
  // ─── Third flight ─── Mythic teardowns only.
  {
    condition: "Museum",
    slots: [structural(0, "Legendary", 2), structural(1, "Legendary", 2)],
  },
  {
    condition: "Museum",
    slots: [structural(0, "Legendary", 3), structural(1, "Legendary", 2)],
  },
  {
    // ★ promotion
    condition: "Museum",
    slots: [
      structural(0, "Legendary", 4),
      structural(1, "Legendary", 3),
      unique(3),
    ],
  },
];

/** Past the ladder the last recipe simply scales up. No further promotions. */
const BEYOND_LADDER_GROWTH = 1.4;

const getBuildStep = (level: number): BuildStep => {
  const capped = Math.max(1, level);
  if (capped <= BUILD_LADDER.length) return BUILD_LADDER[capped - 1];

  const last = BUILD_LADDER[BUILD_LADDER.length - 1];
  const factor = Math.pow(BEYOND_LADDER_GROWTH, capped - BUILD_LADDER.length);
  return {
    condition: last.condition,
    slots: last.slots
      .filter((slot) => slot.tier !== "Unique")
      .map((slot) => ({ ...slot, qty: Math.ceil(slot.qty * factor) })),
  };
};

/** Fame charged per build level — a second axis that grows with the same slope. */
export const BUILD_FAME_PER_LEVEL = 10;

export const getBuildFameCost = (level: number): number =>
  BUILD_FAME_PER_LEVEL * Math.max(1, level);

/**
 * Whether this level promotes *this* item — every third level, but only while the
 * item still has promotions left. A Mythic promotes once (to Custom Shop) and then
 * levels 6 and 9 are ordinary builds for it, rather than charging it for a
 * promotion it can no longer receive.
 */
export const isPromotionLevel = (
  level: number,
  mintRarity: GuitarRarity,
): boolean =>
  level % BUILDS_PER_PROMOTION === 0 &&
  level / BUILDS_PER_PROMOTION <= getPromotionsAvailable(mintRarity);

// ─── Resolving a recipe against a real item ──────────────────────────────────

/** Distinct part types in the subject's BOM, in salvage order. */
export const getBomParts = (bom: ScrapBom): PartId[] => {
  const seen: PartId[] = [];
  for (const slot of bom) {
    if (PARTS_BY_ID.has(slot.partId) && !seen.includes(slot.partId)) {
      seen.push(slot.partId);
    }
  }
  return seen;
};

/**
 * BOM parts that can carry any tier, best-supplied first. Pots cap at Epic and
 * screws at Standard, so they can never stand in for a Legendary slot — filler is
 * always named outright.
 *
 * The order is *not* the BOM's. Salvage order says which part is the headline of a
 * teardown; it says nothing about whether the game can supply that part at the
 * tier a recipe wants. Ranking by `getPartSupply` instead is what keeps every
 * archetype buildable: a part that heads a BOM but that no Legendary item in the
 * roster pays out drops to the back of the queue rather than becoming a wall.
 */
const getStructuralParts = (bom: ScrapBom): PartId[] =>
  getBomParts(bom)
    .filter((id) => PARTS_BY_ID.get(id)?.maxTier === "Legendary")
    // Stable, so parts the tables supply equally keep their salvage order.
    .sort(
      (a, b) =>
        getPartSupply(b, SUPPLY_RANK_TIER) - getPartSupply(a, SUPPLY_RANK_TIER),
    );

/** The BOM part a Unique slot resolves to. */
const getUniquePart = (bom: ScrapBom): PartId | null =>
  getBomParts(bom).find((id) => PARTS_BY_ID.get(id)?.unique) ?? null;

const resolveSlot = (slot: RecipeSlot, bom: ScrapBom): ScrapPart | null => {
  if (slot.source.kind === "fixed") {
    return { partId: slot.source.partId, tier: slot.tier, qty: slot.qty };
  }

  if (slot.source.kind === "unique") {
    const partId = getUniquePart(bom);
    return partId ? { partId, tier: slot.tier, qty: slot.qty } : null;
  }

  const structuralParts = getStructuralParts(bom);
  if (structuralParts.length === 0) return null;
  // Short BOMs fall back to their last structural part rather than dropping the
  // slot, so a three-part item still pays a full price for its level.
  const partId =
    structuralParts[Math.min(slot.source.index, structuralParts.length - 1)];
  return { partId, tier: slot.tier, qty: slot.qty };
};

/** Folds duplicate (part, tier) lines so a merged slot reads as one row. */
const mergeRecipe = (parts: ScrapPart[]): ScrapPart[] => {
  const rows = new Map<string, ScrapPart>();
  for (const part of parts) {
    const key = `${part.partId}:${part.tier}`;
    const existing = rows.get(key);
    if (existing) existing.qty += part.qty;
    else rows.set(key, { ...part });
  }
  return [...rows.values()];
};

/**
 * The exact parts a build level costs on this item. Same list every time — the
 * only inputs are the level and the item's own BOM.
 */
export const getBuildRecipeParts = (
  level: number,
  bom: ScrapBom,
  mintRarity: GuitarRarity,
): ScrapPart[] => {
  const promotes = isPromotionLevel(level, mintRarity);
  const resolved: ScrapPart[] = [];

  for (const slot of getBuildStep(level).slots) {
    // An item with no promotions left is not billed for the Unique it cannot use.
    if (slot.tier === "Unique" && !promotes) continue;
    const part = resolveSlot(slot, bom);
    if (part) resolved.push(part);
  }

  return mergeRecipe(resolved);
};

/** How many pieces of a given part and tier the wallet holds. */
const countHeld = (
  wallet: ScrapPart[],
  partId: PartId,
  tier: PartTier,
): number =>
  wallet
    .filter((p) => p.partId === partId && p.tier === tier)
    .reduce((sum, p) => sum + p.qty, 0);

/** A recipe measured against a wallet, line by line. */
export const priceRecipe = (
  recipe: ScrapPart[],
  wallet: ScrapPart[],
): RecipeLine[] =>
  recipe.map((line) => {
    const have = countHeld(wallet, line.partId, line.tier);
    return {
      partId: line.partId,
      tier: line.tier,
      need: line.qty,
      have,
      ok: have >= line.qty,
    };
  });

/** The parts a recipe consumes, in the shape the wallet maths expects. */
export const recipeToParts = (recipe: RecipeLine[]): ScrapPart[] =>
  recipe.map(({ partId, tier, need }) => ({ partId, tier, qty: need }));

/** Removes a job's parts from the wallet. Mirrors `addPartsToWallet` in `utils/scrap`. */
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

// ─── Repair (condition) ──────────────────────────────────────────────────────

/**
 * Condition stays a bounded 0–1 physical state — it feeds `getItemValue` and the
 * market, so stretching it past Museum would break pricing. It is not a cap on
 * progression though: it is the *gate* the build ladder keeps raising.
 *
 * Restoration recipes are fixed too, and climb the same way: a Worn respray is
 * screws, a Museum-grade restoration wants Epic parts off the instrument itself.
 */
interface RepairStep {
  key: ConditionKey;
  to: number;
  slots: RecipeSlot[];
}

const REPAIR_STEPS: RepairStep[] = [
  { key: "Worn", to: 0.18, slots: [fixed("screws", "Standard", 6)] },
  {
    key: "Good",
    to: 0.43,
    slots: [fixed("screws", "Standard", 10), fixed("pot", "Standard", 3)],
  },
  {
    // Standard pots, not Epic: the multiplier below turns three Epic pots into
    // fifteen on a Custom Shop item, and Epic pots are the scarcest thing the
    // drop tables produce — a restoration must not be dearer than the build.
    key: "Mint",
    to: 0.73,
    slots: [fixed("pot", "Standard", 4), structural(0, "Standard", 4)],
  },
  {
    key: "Museum",
    to: 0.95,
    slots: [structural(0, "Epic", 4), structural(1, "Epic", 3)],
  },
];

/** Restoring a Mythic is four times the work of restoring a Common. */
export const REPAIR_RARITY_MULT: Record<GuitarRarity, number> = {
  Common: 1,
  Uncommon: 1.2,
  Rare: 1.5,
  Epic: 2,
  Legendary: 3,
  Mythic: 4,
  "Custom Shop": 5,
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
  /** The rarity the item was minted at — drives promotions left, value and scrap. */
  mintRarity: GuitarRarity;
  /** The rarity it is *now*, after any promotions it has earned. */
  rarity: GuitarRarity;
  buildLevel: number;
  condition: number;
  bom: ScrapBom;
  /** Named features currently fitted — what the mod bench reads and writes. */
  features: ItemFeature[];
  /** Pedals only: gates the `appliesTo` half of the mod pool. */
  effectType?: EffectType;
}

export const getGuitarSubject = (
  item: Pick<InventoryItem, "id" | "condition" | "buildLevel" | "features">,
  guitar: Pick<GuitarDefinition, "id" | "name" | "rarity">,
): WorkshopSubject => ({
  id: item.id,
  kind: "guitar",
  name: guitar.name,
  mintRarity: guitar.rarity,
  rarity: getEffectiveRarity(guitar.rarity, item.buildLevel),
  buildLevel: item.buildLevel ?? 0,
  condition: getItemCondition(item),
  bom: getGuitarBom(guitar.id),
  features: item.features ?? [],
});

export const getEffectSubject = (
  item: Pick<
    EffectInventoryItem,
    "id" | "condition" | "buildLevel" | "features"
  >,
  effect: Pick<EffectDefinition, "id" | "name" | "rarity" | "type">,
): WorkshopSubject => ({
  id: item.id,
  kind: "effect",
  name: effect.name,
  mintRarity: effect.rarity,
  rarity: getEffectiveRarity(effect.rarity, item.buildLevel),
  buildLevel: item.buildLevel ?? 0,
  condition: getItemCondition(item),
  bom: getEffectBom(effect.id, effect.type),
  features: item.features ?? [],
  effectType: effect.type,
});

// ─── Quotes — everything the UI and the API need about one job ───────────────

export type WorkshopCheckKind = "condition" | "fame";

/** A non-parts requirement, with progress so the UI can show how close it is. */
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
 * What a build job writes into the item's chronicle.
 *
 * Deliberately *not* a feature name. The label used to be borrowed from the real
 * feature pool ("Hand-wound pickups"), which read as if the build had fitted that
 * mod — it had not: a build buys a level, mods are their own job with their own
 * bill and their own entry in `features`. The log is a record of bench work, so
 * it says exactly that and nothing the item does not have.
 */
export const getBuildLogLabel = (level: number): string =>
  `Bench work · build ${level}`;

// ─── Build ───────────────────────────────────────────────────────────────────

export interface BuildRequirement {
  /** The level being bought (current build level + 1). */
  level: number;
  fame: number;
  condition: ConditionKey;
  /** The rarity this level promotes the item to, when it promotes at all. */
  promotesTo: GuitarRarity | null;
}

export interface BuildQuote {
  requirement: BuildRequirement;
  /** Item Level this level adds. */
  gain: number;
  /** The fixed parts list, measured against the wallet. */
  recipe: RecipeLine[];
  checks: WorkshopCheck[];
  canBuild: boolean;
  /** What this job writes into the build log — bench work, not a feature. */
  logLabel: string;
}

/**
 * Item Level the next build is actually worth.
 *
 * Not simply `RARITY_BUILD_GAIN`: on a promotion level the rarity bonus steps up
 * *and* every build level already paid for starts earning at the higher rate, so
 * the jump is far bigger than an ordinary level. Everything else that feeds the
 * level — features, condition, vintage, origin — is untouched by a build, so the
 * difference between the two rarity-dependent halves is the exact gain.
 */
const getBuildLevelGain = (subject: WorkshopSubject): number => {
  const next = subject.buildLevel + 1;
  const nextRarity = getEffectiveRarity(subject.mintRarity, next);

  const before =
    (RARITY_LEVEL_BONUS[subject.rarity] ?? 0) +
    subject.buildLevel * (RARITY_BUILD_GAIN[subject.rarity] ?? 1);
  const after =
    (RARITY_LEVEL_BONUS[nextRarity] ?? 0) +
    next * (RARITY_BUILD_GAIN[nextRarity] ?? 1);

  return after - before;
};

export const getBuildRequirement = (
  level: number,
  mintRarity: GuitarRarity,
  currentRarity: GuitarRarity,
): BuildRequirement => {
  const promotes = isPromotionLevel(level, mintRarity);
  return {
    level,
    fame: getBuildFameCost(level),
    condition: getBuildStep(level).condition,
    promotesTo: promotes
      ? (RARITY_LADDER[RARITY_LADDER.indexOf(currentRarity) + 1] ?? null)
      : null,
  };
};

export const getBuildQuote = (
  subject: WorkshopSubject,
  wallet: ScrapPart[],
  fame: number,
): BuildQuote => {
  const level = subject.buildLevel + 1;
  const requirement = getBuildRequirement(
    level,
    subject.mintRarity,
    subject.rarity,
  );

  const parts = getBuildRecipeParts(level, subject.bom, subject.mintRarity);
  const recipe = priceRecipe(parts, wallet);

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
      kind: "fame",
      label: "Fame",
      current: fame,
      required: requirement.fame,
      ok: fame >= requirement.fame,
    },
  ];

  return {
    requirement,
    gain: getBuildLevelGain(subject),
    recipe,
    checks,
    canBuild: checks.every((c) => c.ok) && recipe.every((line) => line.ok),
    logLabel: getBuildLogLabel(level),
  };
};

// ─── Repair ──────────────────────────────────────────────────────────────────

export interface RepairQuote {
  /** `null` once the item is already Museum grade. */
  target: ConditionKey | null;
  fromCondition: number;
  toCondition: number;
  /** Item Level the step is worth (condition contributes 0–10). */
  gain: number;
  recipe: RecipeLine[];
  canRepair: boolean;
}

/** The exact parts a restoration costs on this item. */
export const getRepairRecipeParts = (
  step: RepairStep,
  bom: ScrapBom,
  rarity: GuitarRarity,
): ScrapPart[] => {
  const mult = REPAIR_RARITY_MULT[rarity] ?? 1;
  const resolved: ScrapPart[] = [];

  for (const slot of step.slots) {
    const part = resolveSlot({ ...slot, qty: Math.ceil(slot.qty * mult) }, bom);
    if (part) resolved.push(part);
  }

  return mergeRecipe(resolved);
};

export const getRepairQuote = (
  subject: WorkshopSubject,
  wallet: ScrapPart[],
): RepairQuote => {
  // A step has to actually move the item up a *grade*. Matching on the raw number
  // instead would offer a "Museum Grade → Museum Grade" job to anything sitting
  // between the grade's floor and its target, which reads as a bug to the player.
  const currentRank = getConditionRank(
    getConditionGrade(subject.condition).key,
  );
  const step = REPAIR_STEPS.find((s) => getConditionRank(s.key) > currentRank);

  if (!step) {
    return {
      target: null,
      fromCondition: subject.condition,
      toCondition: subject.condition,
      gain: 0,
      recipe: [],
      canRepair: false,
    };
  }

  const parts = getRepairRecipeParts(step, subject.bom, subject.rarity);
  const recipe = priceRecipe(parts, wallet);

  return {
    target: step.key,
    fromCondition: subject.condition,
    toCondition: step.to,
    gain: Math.round(step.to * 10) - Math.round(subject.condition * 10),
    recipe,
    canRepair: recipe.every((line) => line.ok),
  };
};

// ─── Mods (fitting named features) ───────────────────────────────────────────

/**
 * The third job on the bench: bolting one more named feature onto the instrument.
 *
 * Build and repair both move a single number the item already has. A mod changes
 * what the item *is* — it is the only way to put a `+4 Hand-wound pickups` on a
 * guitar that did not roll one out of the case.
 *
 * Four rules, all deliberate:
 *
 *  • **Every mod has its own bill, and it is the same on every item.** Unlike a
 *    build — whose recipe is derived from the subject's own BOM — a mod costs
 *    what that mod is made of: brass trem block asks for bridges, a fret level
 *    asks for necks. A Common and a Mythic pay the same price for the same mod,
 *    so the player picks the mod they want and can stockpile for it by name.
 *
 *  • **It has to physically fit.** The pool is filtered by the item's own BOM: a
 *    set-neck guitar has no `neck` slot, so no neck mods; a headless one has no
 *    tuners. Pedals keep the `appliesTo` type gate the case roller already uses.
 *    Features that map to no part at all (copper shielding, a pro setup) fit
 *    anything, because nothing has to be there for them to be done.
 *
 *  • **Rarity caps how many.** The ceiling is `RARITY_MAX_FEATURES`, the same
 *    table the case roller fills against — so what came out of the case counts
 *    towards it, and a promotion (every third build level) is what buys more room.
 *    Fill the slots and the item is done taking mods.
 *
 *  • **The value is rolled, and re-rollable.** Which mod goes on is the player's
 *    choice — they are paying a named bill for it. What it is *worth* is not: a
 *    bench mod draws from the feature's own range widened by `MOD_ROLL_BONUS`, so
 *    workshop work can beat anything a case can drop. A re-roll costs that mod's
 *    bill again and *always* replaces the old number, downward included.
 */

/** Extra headroom a bench-rolled value has over a case-rolled one. */
export const MOD_ROLL_BONUS = 2;

const bill = (...rows: [PartId, PartTier, number][]): ScrapPart[] =>
  rows.map(([partId, tier, qty]) => ({ partId, tier, qty }));

/**
 * What each mod is made of.
 *
 * Every mod has its own bill and the parts are the ones the job physically uses:
 * a brass trem block is bridges, a fret level is neck work, copper shielding is a
 * box of screws and an afternoon. Nothing here depends on the *item* — a Common
 * and a Mythic pay the same price for the same mod — but the mods differ from
 * each other, and the stronger ones cost the better tier.
 *
 * No Unique parts anywhere: those gate promotions, and a job that can be run
 * forever must not compete for them.
 */
const MOD_BILLS: Record<string, ScrapPart[]> = {
  // ─── Guitar · pickups and electronics ──────────────────────────────────────
  "hand-wound": bill(["pickup", "Legendary", 2], ["pot", "Epic", 2], ["screws", "Standard", 8]),
  "active-preamp": bill(["pickup", "Epic", 3], ["pot", "Epic", 3], ["screws", "Standard", 6]),
  "coil-split": bill(["pot", "Epic", 3], ["screws", "Standard", 6]),
  "push-pull": bill(["pot", "Epic", 3], ["screws", "Standard", 4]),
  "phase-switch": bill(["pot", "Epic", 2], ["screws", "Standard", 6]),
  "cts-pots": bill(["pot", "Epic", 4]),
  "pio-caps": bill(["pot", "Epic", 3], ["screws", "Standard", 4]),
  "treble-bleed": bill(["pot", "Standard", 5], ["screws", "Standard", 4]),
  "copper-shielding": bill(["screws", "Standard", 14], ["pot", "Standard", 3]),
  // ─── Guitar · hardware and resonance ───────────────────────────────────────
  "brass-trem-block": bill(["bridge", "Epic", 3], ["screws", "Standard", 8]),
  "steel-saddles": bill(["bridge", "Epic", 2], ["screws", "Standard", 6]),
  "locking-tuners": bill(["tuners", "Epic", 3], ["screws", "Standard", 6]),
  "bone-nut": bill(["neck", "Standard", 2], ["screws", "Standard", 6]),
  "torrefied-wood": bill(["body", "Epic", 3], ["screws", "Standard", 6]),
  "chambered-body": bill(["body", "Epic", 4], ["screws", "Standard", 10]),
  // ─── Guitar · neck and setup ───────────────────────────────────────────────
  "graphite-neck": bill(["neck", "Legendary", 2], ["screws", "Standard", 6]),
  "stainless-frets": bill(["neck", "Epic", 3], ["screws", "Standard", 8]),
  "compound-radius": bill(["neck", "Epic", 3], ["screws", "Standard", 6]),
  plek: bill(["neck", "Epic", 2], ["screws", "Standard", 8]),
  "scalloped-frets": bill(["neck", "Epic", 2], ["screws", "Standard", 6]),
  "fret-level": bill(["neck", "Epic", 2], ["screws", "Standard", 6]),
  "rolled-edges": bill(["neck", "Epic", 2], ["screws", "Standard", 4]),
  "satin-neck": bill(["neck", "Standard", 3], ["screws", "Standard", 6]),
  "truss-wheel": bill(["neck", "Standard", 2], ["screws", "Standard", 6]),
  "low-action": bill(["neck", "Standard", 1], ["screws", "Standard", 12]),
  // ─── Pedal · tone ──────────────────────────────────────────────────────────
  "nos-opamp": bill(["opamp", "Legendary", 2], ["screws", "Standard", 6]),
  "germanium-diodes": bill(["diode", "Epic", 3], ["screws", "Standard", 6]),
  "matched-transistors": bill(["opamp", "Epic", 3], ["diode", "Epic", 2], ["screws", "Standard", 4]),
  "asym-clipping": bill(["diode", "Epic", 2], ["screws", "Standard", 4]),
  "led-clipping": bill(["diode", "Epic", 2], ["screws", "Standard", 4]),
  "mosfet-clipping": bill(["diode", "Epic", 2], ["screws", "Standard", 4]),
  "carbon-comp": bill(["diode", "Standard", 4], ["screws", "Standard", 6]),
  "film-caps": bill(["pot", "Standard", 4], ["screws", "Standard", 6]),
  // ─── Pedal · headroom ──────────────────────────────────────────────────────
  "charge-pump-18v": bill(["opamp", "Epic", 3], ["pot", "Epic", 2], ["screws", "Standard", 6]),
  "premium-buffer": bill(["opamp", "Epic", 2], ["screws", "Standard", 4]),
  shielding: bill(["enclosure", "Epic", 2], ["screws", "Standard", 10]),
  "true-bypass": bill(["enclosure", "Standard", 2], ["screws", "Standard", 6]),
  "gold-jacks": bill(["enclosure", "Standard", 2], ["screws", "Standard", 6]),
  "star-grounding": bill(["pot", "Standard", 2], ["screws", "Standard", 12]),
  "filtered-power": bill(["pot", "Epic", 2], ["screws", "Standard", 6]),
  // ─── Pedal · versatility ───────────────────────────────────────────────────
  midi: bill(["opamp", "Legendary", 2], ["pot", "Epic", 3], ["screws", "Standard", 6]),
  presets: bill(["opamp", "Epic", 3], ["pot", "Epic", 2], ["screws", "Standard", 6]),
  "tap-tempo": bill(["opamp", "Epic", 3], ["screws", "Standard", 6]),
  "stereo-io": bill(["enclosure", "Epic", 2], ["opamp", "Epic", 2], ["screws", "Standard", 6]),
  "relay-switch": bill(["opamp", "Epic", 2], ["enclosure", "Standard", 2], ["screws", "Standard", 6]),
  "expression-in": bill(["pot", "Epic", 3], ["screws", "Standard", 6]),
  "trim-pots": bill(["pot", "Epic", 3], ["screws", "Standard", 4]),
  "dip-switches": bill(["pot", "Standard", 4], ["screws", "Standard", 8]),
  "kill-dry": bill(["opamp", "Epic", 2], ["pot", "Epic", 2], ["screws", "Standard", 4]),
};

/**
 * A mod with no authored bill still has to be buildable — otherwise adding a
 * feature to either pool would quietly ship a job nobody can pay for. Falls back
 * to the part the feature physically is, plus a handful of screws.
 */
const getFallbackBill = (featureId: string): ScrapPart[] => {
  const partId = FEATURE_PART_UPGRADES[featureId];
  return partId
    ? bill([partId, "Epic", 3], ["screws", "Standard", 8])
    : bill(["screws", "Standard", 12], ["pot", "Standard", 3]);
};

export const getModBill = (featureId: string): ScrapPart[] =>
  MOD_BILLS[featureId] ?? getFallbackBill(featureId);

/** A feature the bench can fit, flattened out of the guitar and pedal pools. */
export interface ModFeatureDef {
  id: string;
  label: string;
  /** Lowest value the bench can roll. */
  min: number;
  /** Highest — the pool's own max plus `MOD_ROLL_BONUS`. */
  max: number;
  /** This mod's own thematic bill. Identical on every item in the game. */
  parts: ScrapPart[];
}

const toModDef = (def: {
  id: string;
  label: string;
  min: number;
  max: number;
}): ModFeatureDef => ({
  id: def.id,
  label: def.label,
  min: def.min,
  max: def.max + MOD_ROLL_BONUS,
  parts: getModBill(def.id),
});

/**
 * Every mod this instrument could physically take, fitted or not.
 *
 * For guitars the gate is the BOM — construction decides what there is to modify.
 * For pedals it is the type, which is how `rollEffectFeatures` already gates them.
 */
export const getFittableMods = (subject: WorkshopSubject): ModFeatureDef[] => {
  if (subject.kind === "effect") {
    return EFFECT_FEATURES.filter(
      (f) =>
        !f.appliesTo ||
        (subject.effectType != null && f.appliesTo.includes(subject.effectType)),
    ).map(toModDef);
  }

  const bomParts = new Set(getBomParts(subject.bom));
  return GUITAR_FEATURES.filter((f) => {
    const partId = FEATURE_PART_UPGRADES[f.id];
    return !partId || bomParts.has(partId);
  }).map(toModDef);
};

export interface ModSlots {
  used: number;
  /** `RARITY_MAX_FEATURES` at the item's *current* rarity — promotions raise it. */
  max: number;
  free: number;
}

export const getModSlots = (subject: WorkshopSubject): ModSlots => {
  const max = RARITY_MAX_FEATURES[subject.rarity] ?? 2;
  const used = subject.features.length;
  return { used, max, free: Math.max(0, max - used) };
};

/** A mod priced against the wallet — the shape both lists in the UI render. */
export interface ModOption extends ModFeatureDef {
  recipe: RecipeLine[];
  affordable: boolean;
}

/** One currently fitted mod: its value now, and what re-rolling it would cost. */
export interface FittedMod extends ModOption {
  points: number;
}

export interface ModQuote {
  slots: ModSlots;
  /** Mods that fit this item and are not on it yet — the fit menu. */
  candidates: ModOption[];
  /** What is fitted right now, in the order the item stores it. */
  fitted: FittedMod[];
  /** At least one free slot and one affordable mod to put in it. */
  canFit: boolean;
  /** At least one fitted mod whose bill the wallet covers. */
  canReroll: boolean;
}

/**
 * Every mod in one kind's pool, ignoring any particular instrument.
 *
 * `getFittableMods` answers "what can go on *this*"; this answers "what exists",
 * which is what anything drawing a mod out of thin air — the trader's daily
 * shelf — has to draw from.
 */
export const getModPool = (kind: WorkshopKind): ModFeatureDef[] =>
  (kind === "guitar" ? GUITAR_FEATURES : EFFECT_FEATURES).map(toModDef);

/** Looks a feature up in the pool for `kind`, whether or not it fits the subject. */
export const getModDef = (
  kind: WorkshopKind,
  featureId: string,
): ModFeatureDef | null => {
  const pool = kind === "guitar" ? GUITAR_FEATURES : EFFECT_FEATURES;
  const def = pool.find((f) => f.id === featureId);
  return def ? toModDef(def) : null;
};

const priceMod = (def: ModFeatureDef, wallet: ScrapPart[]): ModOption => {
  const recipe = priceRecipe(def.parts, wallet);
  return { ...def, recipe, affordable: recipe.every((line) => line.ok) };
};

export const getModQuote = (
  subject: WorkshopSubject,
  wallet: ScrapPart[],
): ModQuote => {
  const slots = getModSlots(subject);

  const fittable = getFittableMods(subject);
  const byId = new Map(fittable.map((def) => [def.id, def]));
  const owned = new Set(subject.features.map((f) => f.id));

  // A feature the item carries but that no longer fits (pool edits, legacy rolls)
  // is still shown and still re-rollable — it is on the instrument either way.
  const fitted: FittedMod[] = subject.features.flatMap((f) => {
    const def = byId.get(f.id) ?? getModDef(subject.kind, f.id);
    return def ? [{ ...priceMod(def, wallet), points: f.points }] : [];
  });

  const candidates = fittable
    .filter((def) => !owned.has(def.id))
    .map((def) => priceMod(def, wallet));

  return {
    slots,
    candidates,
    fitted,
    canFit: slots.free > 0 && candidates.some((c) => c.affordable),
    canReroll: fitted.some((f) => f.affordable),
  };
};

/** Uniform roll across the widened range. Server-side only — the client never rolls. */
export const rollModPoints = (def: ModFeatureDef): number =>
  def.min + Math.floor(Math.random() * (def.max - def.min + 1));
