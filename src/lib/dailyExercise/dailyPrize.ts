import { EFFECT_FEATURES, EFFECT_STAT_LABELS } from "feature/arsenal/data/effectStats";
import { GUITAR_FEATURES, STAT_LABELS } from "feature/arsenal/data/itemStats";
import { PART_DEFINITIONS } from "feature/arsenal/data/partDefinitions";
import { getModPool } from "feature/arsenal/data/workshop";
import type { PartId, WorkshopKind } from "feature/arsenal/types/arsenal.types";
import { seededPick } from "feature/arsenal/utils/seededRandom";
import type { DailyExercisePrize } from "feature/dailyExercise/types/dailyExercise.types";
import { rewardRandom } from "lib/rewards/rewardPayout";

/** A day pays a mod or a part, evenly. */
const MOD_CHANCE = 0.5;
/** Even split between the mod pools, as the trader and the level ladder draw. */
const MOD_GUITAR_CHANCE = 0.5;

/**
 * The prize part's grade. Legendary is the top of the ladder anything drops at;
 * Unique sits above it but is worth thousands of Fame in fusion, far past what
 * one day's #1 should pay.
 */
export const DAILY_PRIZE_PART_TIER = "Legendary" as const;

/** Parts that reach Legendary at all — a screw has no Legendary grade. */
const LEGENDARY_PARTS = PART_DEFINITIONS.filter((part) => part.maxTier === DAILY_PRIZE_PART_TIER);

/** The stat a mod raises, as the Arsenal names it — the card says it plainly. */
const statLabelOf = (modKind: WorkshopKind, featureId: string): string => {
  if (modKind === "guitar") {
    const feature = GUITAR_FEATURES.find((f) => f.id === featureId);
    return feature ? STAT_LABELS[feature.category] : "";
  }
  const feature = EFFECT_FEATURES.find((f) => f.id === featureId);
  return feature ? EFFECT_STAT_LABELS[feature.category] : "";
};

const pickMod = (random: () => number): DailyExercisePrize => {
  const modKind: WorkshopKind = random() < MOD_GUITAR_CHANCE ? "guitar" : "effect";
  const def = seededPick(getModPool(modKind), random)!;
  return {
    kind: "mod",
    modKind,
    featureId: def.id,
    label: def.label,
    // The ceiling of what the bench can roll — a mod no reward or trader pays,
    // and only the luckiest build ever makes. That is what makes it rare.
    points: def.max,
    statLabel: statLabelOf(modKind, def.id),
  };
};

const pickPart = (random: () => number): DailyExercisePrize => {
  const def = seededPick(LEGENDARY_PARTS, random)!;
  return { kind: "part", partId: def.id as PartId, label: def.label, tier: DAILY_PRIZE_PART_TIER };
};

/**
 * What `dayKey`'s #1 wins: one rare mod or one Legendary part, fixed for the
 * whole day.
 *
 * Seeded off the day alone, so the card can show the prize from the first
 * minute and the settlement pays exactly what was shown — the same rule the
 * level ladder uses to print its rewards in advance.
 */
export const getDailyPrize = (dayKey: string): DailyExercisePrize => {
  const random = rewardRandom(`daily-exercise-prize:${dayKey}`);
  return random() < MOD_CHANCE ? pickMod(random) : pickPart(random);
};

/** The prize in words, as the notification names it. */
export const describeDailyPrize = (prize: DailyExercisePrize): string =>
  prize.kind === "mod"
    ? `a +${prize.points} ${prize.label} mod`
    : `a ${prize.tier} ${prize.label}`;
