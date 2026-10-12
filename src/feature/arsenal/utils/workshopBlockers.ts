import type { Translate } from "lib/i18n/translate";
import { translateOr } from "lib/i18n/translate";

import { getPartLabel } from "../data/partDefinitions";
import type {
  ModOption,
  ModQuote,
  RecipeLine,
  WorkshopCheck,
} from "../data/workshop";
import { getGradeByRank } from "../data/workshop";
import type { PartId } from "../types/arsenal.types";

/** "Body" → "bodies", "Screw" → "screws". Only ever used mid-sentence. */
const pluralPart = (partId: PartId, count: number): string => {
  const label = getPartLabel(partId).toLowerCase();
  if (count === 1) return label;
  return label.endsWith("y") ? `${label.slice(0, -1)}ies` : `${label}s`;
};

/**
 * "3 more Legendary necks" — the whole point of a fixed recipe.
 *
 * English bends the noun ("necks"), which no template can do for every
 * language, so the plural form rides along as `parts` and other languages
 * name the part with `part` in whatever construction suits them.
 */
const describeLine = (line: RecipeLine, t?: Translate): string => {
  const short = line.need - line.have;
  return translateOr(t, "arsenal:blockers.more_parts", "{{count}} more {{tier}} {{parts}}", {
    count: short,
    tier: t ? t(`arsenal:labels.part_tier.${line.tier}`, line.tier) : line.tier,
    parts: pluralPart(line.partId, short),
    part: t
      ? t(`arsenal:labels.part.${line.partId}`, getPartLabel(line.partId))
      : getPartLabel(line.partId),
  });
};

/**
 * Why a job cannot run yet, in the fewest words that still point somewhere.
 *
 * One description for all three benches. Naming the missing part is the whole
 * advantage of a fixed recipe, and a job that answers "not enough parts" throws
 * that away — the player is left counting their own screws to find out which of
 * the six lines on the bill is the one holding them up.
 *
 * Order matters: a gate the parts cannot fix comes first, then the parts, then
 * Fame — otherwise a player stockpiles necks for a build that was waiting on a
 * restoration all along.
 */
export const describeBlocker = (
  recipe: RecipeLine[],
  checks: WorkshopCheck[] = [],
  t?: Translate,
): string | undefined => {
  const condition = checks.find((c) => c.kind === "condition" && !c.ok);
  if (condition) {
    const grade = getGradeByRank(condition.required);
    return translateOr(t, "arsenal:blockers.restore_first", "restore it to {{grade}} first", {
      grade: t ? t(`arsenal:labels.condition.${grade.key}`, grade.label) : grade.label,
    });
  }

  // Biggest shortfall first: it is the one that decides when the job unblocks.
  const missing = [...recipe]
    .filter((line) => !line.ok)
    .sort((a, b) => b.need - b.have - (a.need - a.have));

  if (missing.length === 1) return describeLine(missing[0], t);
  if (missing.length > 1) {
    const rest = missing.length - 1;
    return translateOr(
      t,
      "arsenal:blockers.plus_others",
      rest === 1 ? "{{first}}, plus {{count}} other part" : "{{first}}, plus {{count}} other parts",
      { first: describeLine(missing[0], t), count: rest },
    );
  }

  const fame = checks.find((c) => c.kind === "fame" && !c.ok);
  if (fame) {
    return translateOr(t, "arsenal:blockers.more_fame", "needs {{count}} more fame", {
      count: fame.required - fame.current,
    });
  }

  return undefined;
};

/** How far one mod's bill is from being payable — lower is closer. */
const shortfall = (option: ModOption): number =>
  option.recipe.reduce(
    (sum, line) => sum + Math.max(0, line.need - line.have),
    0,
  );

/** The bill the player is closest to paying — the useful one to name. */
const nearestBill = <T extends ModOption>(pool: T[]): T | undefined =>
  [...pool].sort((a, b) => shortfall(a) - shortfall(b))[0];

/**
 * Why the mod bench is closed.
 *
 * Fitting is not one of the jobs this can answer for: a mod goes on out of the
 * stash, which a quote never sees, so the bench short-circuits this whole
 * function whenever a rescued mod is waiting for the instrument. What is left is
 * a re-roll and a removal.
 *
 * Every mod has its own bill, so "not enough parts" is only true when *no* fitted
 * mod can be re-rolled. When that is the case the nearest bill is the useful
 * answer — it is the one the player is closest to paying.
 */
export const describeModBlocker = (quote: ModQuote): string | undefined => {
  if (quote.canReroll) return undefined;

  // Nothing on the instrument to work on: the only way forward is a mod, and the
  // only place one comes from is the stash.
  if (quote.fitted.length === 0) {
    return quote.slots.free === 0
      ? "no mod slots at this rarity — promote it first"
      : "no mod in your stash fits this build";
  }

  const nearest = nearestBill(quote.fitted);
  const missing = nearest && describeBlocker(nearest.recipe);
  return missing
    ? `re-rolling ${nearest.label} needs ${missing}`
    : "no parts for a re-roll";
};
