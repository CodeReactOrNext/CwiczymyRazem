import type { SerializedExercise } from './serializeExercise';

export interface RelatedExerciseCard {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  description: string;
  timeInMinutes: number;
  premium?: boolean;
}

/**
 * Find related exercises for a given exercise.
 * Scoring: +3 same category, +2 per shared skill, +1 same difficulty.
 * Returns top `limit` results, card-only fields (not full tablature).
 */
export function getRelatedExercises(
  current: SerializedExercise,
  all: SerializedExercise[],
  limit = 4
): RelatedExerciseCard[] {
  const scored = all
    .filter((ex) => ex.id !== current.id)
    .map((ex) => {
      let score = 0;

      // Same category: +3
      if (ex.category === current.category) {
        score += 3;
      }

      // Shared skills: +2 each
      if (current.relatedSkills && ex.relatedSkills) {
        const sharedSkills = current.relatedSkills.filter((skill) =>
          ex.relatedSkills.includes(skill)
        );
        score += sharedSkills.length * 2;
      }

      // Same difficulty: +1
      if (ex.difficulty === current.difficulty) {
        score += 1;
      }

      return { exercise: ex, score };
    })
    .sort((a, b) => b.score - a.score);

  // Take top `limit` with score > 0
  const topScored = scored.filter((s) => s.score > 0).slice(0, limit);

  // If fewer than `limit` results, pad with same-category exercises
  if (topScored.length < limit) {
    const sameCategoryIds = new Set(topScored.map((s) => s.exercise.id));
    const padding = scored
      .filter(
        (s) =>
          s.exercise.category === current.category &&
          !sameCategoryIds.has(s.exercise.id)
      )
      .slice(0, limit - topScored.length);
    topScored.push(...padding);
  }

  return topScored
    .slice(0, limit)
    .map(({ exercise: ex }) => ({
      id: ex.id,
      title: ex.title,
      difficulty: ex.difficulty,
      category: ex.category,
      description: ex.description,
      timeInMinutes: ex.timeInMinutes,
      premium: ex.premium,
    }));
}
