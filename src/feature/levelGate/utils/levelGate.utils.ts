import { getPointsToLvlUp } from "utils/gameLogic";

/**
 * Points still missing before the account turns `targetLvl`.
 *
 * `points` is the running total, and levelUpUser promotes as soon as it passes
 * `getPointsToLvlUp(level)` — so the bar for entering `targetLvl` is the
 * threshold of the level below it.
 */
export const pointsToReachLvl = (points: number, targetLvl: number) =>
  Math.max(0, getPointsToLvlUp(targetLvl - 1) - points);

export type LevelStep =
  | { kind: "level"; lvl: number; state: "current" | "todo" | "target" }
  | { kind: "gap" };

/**
 * The levels between here and the unlock, as a row of steps.
 *
 * A long climb collapses to "next two, …, target" so the row keeps its shape
 * on a phone instead of wrapping into a paragraph of circles.
 */
export const buildLevelTrack = (
  lvl: number,
  requiredLvl: number,
  maxSteps = 5,
): LevelStep[] => {
  if (requiredLvl <= lvl) return [];

  const level = (step: number): LevelStep => ({
    kind: "level",
    lvl: step,
    state: step === lvl ? "current" : step === requiredLvl ? "target" : "todo",
  });

  const span = requiredLvl - lvl + 1;
  if (span <= maxSteps) {
    return Array.from({ length: span }, (_, i) => level(lvl + i));
  }

  return [level(lvl), level(lvl + 1), { kind: "gap" }, level(requiredLvl)];
};
