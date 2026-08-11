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

/** "3 more Legendary necks" — the whole point of a fixed recipe. */
const describeLine = (line: RecipeLine): string => {
  const short = line.need - line.have;
  return `${short} more ${line.tier} ${pluralPart(line.partId, short)}`;
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
): string | undefined => {
  const condition = checks.find((c) => c.kind === "condition" && !c.ok);
  if (condition) {
    return `restore it to ${getGradeByRank(condition.required).label} first`;
  }

  // Biggest shortfall first: it is the one that decides when the job unblocks.
  const missing = [...recipe]
    .filter((line) => !line.ok)
    .sort((a, b) => b.need - b.have - (a.need - a.have));

  if (missing.length === 1) return describeLine(missing[0]);
  if (missing.length > 1) {
    const rest = missing.length - 1;
    return `${describeLine(missing[0])}, plus ${rest} other part${rest === 1 ? "" : "s"}`;
  }

  const fame = checks.find((c) => c.kind === "fame" && !c.ok);
  if (fame) return `needs ${fame.required - fame.current} more fame`;

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
 * Every mod has its own bill, so "not enough parts" is only true when *none* of
 * them are affordable. When that is the case the nearest bill is the useful
 * answer — it is the one the player is closest to paying.
 */
export const describeModBlocker = (quote: ModQuote): string | undefined => {
  if (quote.canFit || quote.canReroll) return undefined;

  if (quote.slots.free === 0) {
    // Slots full: the only job left is a re-roll of something already fitted.
    if (quote.fitted.length === 0) {
      return "no mod slots at this rarity — promote it first";
    }
    const nearest = nearestBill(quote.fitted);
    const missing = nearest && describeBlocker(nearest.recipe);
    return missing
      ? `re-rolling ${nearest.label} needs ${missing}`
      : "no parts for a re-roll";
  }

  if (quote.candidates.length === 0) return "nothing else fits this build";

  const nearest = nearestBill(quote.candidates);
  const missing = nearest && describeBlocker(nearest.recipe);
  return missing ? `${nearest.label} needs ${missing}` : undefined;
};
