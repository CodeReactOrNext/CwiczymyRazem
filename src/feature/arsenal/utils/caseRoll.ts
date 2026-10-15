import { EFFECTS_BY_RARITY } from "../data/effectDefinitions";
import { DROPPABLE_GUITARS_BY_RARITY } from "../data/guitarDefinitions";
import type {
  CaseDefinition,
  CasePityCounters,
  EffectDefinition,
  GuitarDefinition,
  GuitarRarity,
} from "../types/arsenal.types";
import {
  drawNewRarity,
  drawOpenRarity,
  drawTopRarity,
  hasReachableNew,
  pickBiased,
} from "./openDraw";
import { getPityForce } from "./pity";

/**
 * Share of a mixed case's opens that are a guitar rather than a pedal.
 *
 * Was 60/40, which left the pedal pool — 54 models, a third of the collection —
 * with 40% of a case, and the Standard case's pedals with 16% of its opens once
 * the Guitar Builder parts took their cut. Even odds is the plain answer.
 */
export const GUITAR_CHANCE = 0.5;

type Kind = "guitar" | "effect";

type Pools = Record<string, readonly { id: number | string }[] | undefined>;

export type RolledDrop =
  | {
      kind: "guitar";
      def: GuitarDefinition;
      rarity: GuitarRarity;
      pityHit?: "new" | "top";
    }
  | {
      kind: "effect";
      def: EffectDefinition;
      rarity: GuitarRarity;
      pityHit?: "new" | "top";
    };

export interface RollInput {
  caseDef: Pick<CaseDefinition, "probabilities" | "dropKind" | "pity">;
  discoveredGuitars: ReadonlySet<number | string>;
  discoveredEffects: ReadonlySet<number | string>;
  /** The case's running counters. Omit for a case with no pity. */
  counters?: CasePityCounters;
  /**
   * A guarantee from the pack this open belongs to: the last open of a pack
   * owes a never-held model, or — when nothing new is within reach — a
   * `minRarity` or better, so a pack never comes back as nothing but repeats.
   */
  packGuarantee?: { newModel: boolean; minRarity?: GuitarRarity };
  random?: () => number;
  /** Test seam. The live pools by default. */
  pools?: { guitars: Pools; effects: Pools };
}

const NO_COUNTERS: CasePityCounters = { sinceNew: 0, sinceTop: 0 };

/**
 * One open of a gear case: which model comes out.
 *
 * Everything that decides a pull lives here and nowhere else, so the odds on the
 * card, the pity counter and the pack guarantee cannot disagree about it. The
 * route only mints what this returns.
 *
 * The order of precedence when guarantees collide:
 *
 *   1. a due *top* guarantee picks the rarity — and prefers one that still holds
 *      something new, so a single pull can pay off both counters;
 *   2. otherwise a due *new-model* guarantee (pity or pack) picks a rarity that
 *      has something new within the re-roll ceiling;
 *   3. a pack guarantee that cannot be honoured as a new model falls back to its
 *      minimum rarity;
 *   4. otherwise the plain roll, with its usual re-roll for collected tiers.
 *
 * A guarantee the player has no way to be paid — nothing new left under the
 * ceiling — is skipped rather than faked, and the pull is an ordinary one.
 */
export function rollGearDrop({
  caseDef,
  discoveredGuitars,
  discoveredEffects,
  counters = NO_COUNTERS,
  packGuarantee,
  random = Math.random,
  pools,
}: RollInput): RolledDrop {
  const guitarPools: Pools = pools?.guitars ?? DROPPABLE_GUITARS_BY_RARITY;
  const effectPools: Pools = pools?.effects ?? EFFECTS_BY_RARITY;
  const odds = caseDef.probabilities;

  const poolsOf = (kind: Kind) =>
    kind === "guitar" ? guitarPools : effectPools;
  const seen = (kind: Kind) =>
    kind === "guitar" ? discoveredGuitars : discoveredEffects;
  const undiscovered = (kind: Kind) => (rarity: GuitarRarity) =>
    (poolsOf(kind)[rarity] ?? []).some((item) => !seen(kind).has(item.id));
  const reachesNew = (kind: Kind) => hasReachableNew(odds, undiscovered(kind));

  let kind: Kind =
    caseDef.dropKind === "guitar"
      ? "guitar"
      : caseDef.dropKind === "effect"
        ? "effect"
        : random() < GUITAR_CHANCE
          ? "guitar"
          : "effect";

  const due = getPityForce(caseDef, counters);
  const dueNew = due.new || packGuarantee?.newModel === true;
  const wantsTop = due.top && caseDef.pity?.top !== undefined;

  if (dueNew) {
    // A mixed case picked its kind before it knew a new model was owed. If that
    // kind has nothing left to find and the other still does, the guarantee is
    // what decides — a pull that cannot be new is not a guarantee kept.
    const other: Kind = kind === "guitar" ? "effect" : "guitar";
    if (!caseDef.dropKind && !reachesNew(kind) && reachesNew(other)) {
      kind = other;
    }
  }

  const hasUndiscovered = undiscovered(kind);
  // Within the re-roll ceiling, which is as far as a new-model guarantee reaches
  // on its own. A due top guarantee has its own, higher, reach — see below.
  const wantsNew = dueNew && reachesNew(kind);

  let rarity: GuitarRarity;
  let usedTop = false;
  if (wantsTop && caseDef.pity?.top) {
    // The top guarantee is what the case already promises at that rarity, so it
    // may favour a tier that still holds something new even above the ceiling:
    // paying both counters with one pull costs the ladder nothing.
    rarity = drawTopRarity(
      odds,
      caseDef.pity.top.rarity,
      random,
      dueNew ? hasUndiscovered : undefined,
    );
    usedTop = true;
  } else if (wantsNew) {
    rarity =
      drawNewRarity(odds, hasUndiscovered, random) ??
      drawOpenRarity(odds, hasUndiscovered, random);
  } else if (packGuarantee?.newModel && packGuarantee.minRarity) {
    // The pack owed a new model and there is none within reach. Its fallback is a
    // floor on rarity, so the pack still pays out something worth opening.
    rarity = drawTopRarity(odds, packGuarantee.minRarity, random);
  } else {
    rarity = drawOpenRarity(odds, hasUndiscovered, random);
  }

  const pool = (poolsOf(kind)[rarity] ??
    poolsOf(kind)["Common"] ??
    []) as readonly (GuitarDefinition | EffectDefinition)[];

  const owesNewItem = usedTop ? dueNew && hasUndiscovered(rarity) : wantsNew;
  const item = pickBiased(
    pool,
    (def) => seen(kind).has(def.id),
    random,
    owesNewItem ? 1 : undefined,
  );

  const isNew = !seen(kind).has(item.id);
  const pityHit: "new" | "top" | undefined = usedTop
    ? "top"
    : wantsNew && isNew && due.new
      ? "new"
      : undefined;

  return kind === "guitar"
    ? { kind, def: item as GuitarDefinition, rarity, pityHit }
    : { kind, def: item as EffectDefinition, rarity, pityHit };
}

/**
 * Can this case still hand the player a model they have never held?
 *
 * The question the shelf asks before it prints a "new model in N" counter: a
 * guarantee that cannot be paid out is not worth showing. Same reach as the draw
 * itself — rarities the case drops, at or below the re-roll ceiling.
 */
export const canDiscoverNew = (
  caseDef: Pick<CaseDefinition, "probabilities" | "dropKind">,
  discoveredGuitars: ReadonlySet<number | string>,
  discoveredEffects: ReadonlySet<number | string>,
): boolean => {
  const reach = (pools: Pools, seen: ReadonlySet<number | string>) =>
    hasReachableNew(caseDef.probabilities, (rarity) =>
      (pools[rarity] ?? []).some((item) => !seen.has(item.id)),
    );
  const guitars = reach(DROPPABLE_GUITARS_BY_RARITY, discoveredGuitars);
  const effects = reach(EFFECTS_BY_RARITY, discoveredEffects);
  if (caseDef.dropKind === "guitar") return guitars;
  if (caseDef.dropKind === "effect") return effects;
  return guitars || effects;
};
