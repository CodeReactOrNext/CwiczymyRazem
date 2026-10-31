import type { DifficultyLevel, Exercise } from "../../../types/exercise.types";

/** What one finished exercise is worth to every skill it trains. */
const POINTS_BY_DIFFICULTY: Record<DifficultyLevel, number> = {
  beginner: 1,
  easy:     1,
  medium:   2,
  hard:     3,
};

/**
 * Skill points the session earned, by skill id.
 *
 * Only exercises the player actually played through count — `completedIndexes`
 * holds the indexes `useSessionProgress` marked as practised. An exercise that
 * trains no skill contributes nothing.
 *
 * A session ended early (see `FinishSessionDialog`) never calls this: it logs
 * the practice time and scores nothing — skill points included.
 */
export const computeSkillPointsGained = (
  exercises: Exercise[],
  completedIndexes: number[],
): Record<string, number> =>
  exercises.reduce<Record<string, number>>((acc, exercise, index) => {
    if (!completedIndexes.includes(index)) return acc;

    const points = POINTS_BY_DIFFICULTY[exercise.difficulty] ?? 0;
    if (points > 0 && exercise.relatedSkills) {
      exercise.relatedSkills.forEach((skillId) => {
        acc[skillId] = (acc[skillId] || 0) + points;
      });
    }
    return acc;
  }, {});

/**
 * The session's per-skill time as whole milliseconds, without the skills that
 * got no measurable time — what the report sends as `skillTimeGained`.
 */
export const roundSkillTime = (
  skillTime: Record<string, number>,
): Record<string, number> =>
  Object.fromEntries(
    Object.entries(skillTime)
      .map(([skillId, ms]) => [skillId, Math.round(ms)] as const)
      .filter(([, ms]) => ms > 0),
  );
