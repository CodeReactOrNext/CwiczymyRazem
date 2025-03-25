import type { DifficultyLevel, Exercise } from "../types/exercise.types";

export const determinePlanDifficulty = (exercises: Exercise[]) => {
  const difficultyCount: Record<DifficultyLevel, number> = {
    easy: 0,
    medium: 0,
    hard: 0,
  };

  exercises.forEach((exercise) => {
    if (!difficultyCount[exercise.difficulty]) {
      difficultyCount[exercise.difficulty] = 0;
    }
    difficultyCount[exercise.difficulty]++;
  });

  let maxCount = 0;
  let mostCommonDifficulty: DifficultyLevel = "easy";

  for (const [difficulty, count] of Object.entries(difficultyCount)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonDifficulty = difficulty as DifficultyLevel;
    }
  }

  return mostCommonDifficulty;
};
