import type { DailyPoolEntry } from "../data/dailyCase";
import type {
  CaseDefinition,
  CasePityCounters,
  EffectDefinition,
  GuitarDefinition,
  GuitarRarity,
} from "../types/arsenal.types";
import { rollGearDrop } from "./caseRoll";
import { pickCuratedDrop } from "./curatedDraw";
import { drawRarity } from "./openDraw";
import { advancePity, isAtLeast } from "./pity";

/**
 * What the last open of a pack owes when nothing else in it was new: a model the
 * player has never held, or this rarity or better when nothing new is in reach.
 */
export const PACK_MIN_RARITY: GuitarRarity = "Rare";

/** One pull, decided but not yet minted. */
export type Draw<Part = unknown> =
  | {
      kind: "guitar";
      def: GuitarDefinition;
      rarity: GuitarRarity;
      isNew: boolean;
      pityHit?: "new" | "top";
      pityAfter?: CasePityCounters;
    }
  | {
      kind: "effect";
      def: EffectDefinition;
      rarity: GuitarRarity;
      isNew: boolean;
      pityHit?: "new" | "top";
      pityAfter?: CasePityCounters;
    }
  | { kind: "component"; item: Part };

interface PlanInput<Part> {
  caseDef: Pick<CaseDefinition, "id" | "probabilities" | "dropKind" | "pity">;
  /** How many opens: 1 for a plain open, 5 or 10 for a pack. */
  count: number;
  /**
   * What the account has already found. Mutated: every model drawn is added as
   * it is drawn, which is what lets the next open of a pack see it as found.
   */
  discoveredGuitars: Set<number | string>;
  discoveredEffects: Set<number | string>;
  /** The case's running pity counters, or undefined for a case with none. */
  counters?: CasePityCounters;
  /** The Featured pool or the Supporter slate. Absent for every other case. */
  curatedPool?: readonly DailyPoolEntry[] | null;
  /** Rolls one Guitar Builder part; called only by the Parts Crate. */
  rollPart: () => Part;
  random?: () => number;
}

export interface DrawPlan<Part> {
  draws: Draw<Part>[];
  /** The counters after the last open. Undefined when the case has none. */
  counters?: CasePityCounters;
}

/**
 * Every pull of one request, decided in memory and in order.
 *
 * Nothing here touches the database, which is the whole reason a pack can be a
 * single transaction: the draws only need what the account already holds. They
 * do see each other — a model pulled on the second open is found by the third,
 * and the pity counters move open by open — so a pack of ten behaves exactly as
 * ten separate opens would, with one addition: the last open of a pack owes a
 * model the player has never held, or `PACK_MIN_RARITY` or better when nothing
 * new is within reach, so a pack never comes back as nothing but repeats.
 */
export function planDraws<Part>({
  caseDef,
  count,
  discoveredGuitars,
  discoveredEffects,
  counters: startCounters,
  curatedPool,
  rollPart,
  random = Math.random,
}: PlanInput<Part>): DrawPlan<Part> {
  let counters = startCounters;
  let packHadNew = false;
  let packHadTop = false;
  const draws: Draw<Part>[] = [];

  for (let i = 0; i < count; i++) {
    // The Parts Crate is the only way a Guitar Builder part comes out of a case.
    if (caseDef.dropKind === "component") {
      draws.push({ kind: "component", item: rollPart() });
      continue;
    }

    const isLast = i === count - 1;
    // Curated cases have no collection to complete, so no "never held" to owe.
    const packGuarantee =
      count > 1 && isLast && !curatedPool && !packHadNew
        ? {
            newModel: true,
            minRarity: packHadTop ? undefined : PACK_MIN_RARITY,
          }
        : undefined;

    // Curated cases draw from a fixed list. Rarity is still rolled from the
    // case's own table; `pickCuratedDrop` then decides which item of the pool
    // that turns into, skipping duplicates while the pool still holds something
    // new at or below the rolled rarity.
    const pick = curatedPool
      ? pickCuratedDrop(
          curatedPool,
          drawRarity(caseDef.probabilities, random),
          (entry) => entry.def.rarity,
          (entry) =>
            entry.kind === "guitar"
              ? discoveredGuitars.has(entry.def.id)
              : discoveredEffects.has(entry.def.id),
          random,
        )
      : null;

    const drop = pick
      ? pick.kind === "guitar"
        ? ({ kind: "guitar", def: pick.def, rarity: pick.def.rarity } as const)
        : ({ kind: "effect", def: pick.def, rarity: pick.def.rarity } as const)
      : rollGearDrop({
          caseDef,
          discoveredGuitars,
          discoveredEffects,
          counters,
          packGuarantee,
          random,
        });

    const seen = drop.kind === "guitar" ? discoveredGuitars : discoveredEffects;
    const isNew = !seen.has(drop.def.id);
    seen.add(drop.def.id);

    // Pity moves on every open of a case that carries one, whichever way the
    // pull went.
    if (counters) {
      counters = advancePity(caseDef, counters, {
        isNew,
        rarity: drop.rarity,
      });
    }
    if (isNew) packHadNew = true;
    if (isAtLeast(drop.rarity, PACK_MIN_RARITY)) packHadTop = true;

    const pityHit = "pityHit" in drop ? drop.pityHit : undefined;
    draws.push({
      kind: drop.kind,
      def: drop.def,
      rarity: drop.rarity,
      isNew,
      ...(pityHit ? { pityHit } : {}),
      ...(counters ? { pityAfter: counters } : {}),
    } as Draw<Part>);
  }

  return { draws, counters };
}
