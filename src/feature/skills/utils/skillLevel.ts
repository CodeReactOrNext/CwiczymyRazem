/**
 * Points the first level-up takes. Every level after needs this many more than
 * the one before, so levels start at 0, 5, 15, 30, 50, 75… points.
 *
 * A finished exercise is worth 1–3 points to every skill it trains, so the
 * first levels come within a session or two and the later ones take months.
 */
const LEVEL_STEP = 5;

/** Skill points at which `level` starts. */
export const skillLevelStart = (level: number) =>
  (LEVEL_STEP * (level - 1) * level) / 2;

export interface SkillLevelProgress {
  /** 1 and up — a skill with no points yet is level 1. */
  level: number;
  /** 0–1 of the way from this level's start to the next level. */
  progress: number;
  /** Skill points at which the next level starts. */
  nextAt: number;
  /** Points still missing to the next level. */
  toNext: number;
}

/** A skill's level from its points, like an RPG character's from XP. */
export const getSkillLevelProgress = (points: number): SkillLevelProgress => {
  const value = Math.max(0, points);
  let level = 1;
  while (skillLevelStart(level + 1) <= value) level++;

  const start = skillLevelStart(level);
  const nextAt = skillLevelStart(level + 1);
  return {
    level,
    progress: (value - start) / (nextAt - start),
    nextAt,
    toNext: nextAt - value,
  };
};

export const getSkillLevel = (points: number) =>
  getSkillLevelProgress(points).level;

/**
 * Level per skill id, for the skills that have points. Untouched skills stay
 * out, so the skill map keeps leaving their branches without a level.
 */
export const getSkillLevels = (
  unlockedSkills: Record<string, number> | undefined,
): Record<string, number> =>
  Object.fromEntries(
    Object.entries(unlockedSkills ?? {})
      .filter(([, points]) => points > 0)
      .map(([skillId, points]) => [skillId, getSkillLevel(points)]),
  );
