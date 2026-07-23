import { exercisesAgregat } from 'feature/exercisePlan/data/exercisesAgregat';
import { ExerciseCard } from 'feature/exercises/components/ExerciseCard/ExerciseCard';
import { getExerciseLandingHref } from 'lib/exerciseLandingLink';

// MDX content is compiled with no scope, so every prop must survive as a plain
// string (see AppCard for the same constraint).
interface ExercisePromoProps {
  /** Exercise id, e.g. "spider_basic" — see feature/exercisePlan/data/exerises/**\/*.ts. */
  exerciseId: string;
  /** Lead-in copy shown above the card. */
  label?: string;
}

/**
 * Drop-in-content link to a specific exercise, meant to be used inline inside
 * blog post MDX (e.g. right after the section that explains the technique it
 * drills) instead of only pointing readers at the app in the closing section.
 */
export const ExercisePromo = ({ exerciseId, label = 'Try it yourself' }: ExercisePromoProps) => {
  const exercise = exercisesAgregat.find((ex) => ex.id === exerciseId);

  // Fail quietly in content: a typo'd id shouldn't break the whole article render.
  if (!exercise || exercise.premium) return null;

  return (
    <div className="not-prose my-10">
      <div className="mb-3 text-xs font-bold tracking-wide text-cyan-400">{label}</div>
      <ExerciseCard
        exercise={{
          id: exercise.id,
          title: exercise.title,
          difficulty: exercise.difficulty,
          category: exercise.category,
          description: exercise.description,
          timeInMinutes: exercise.timeInMinutes,
          premium: exercise.premium,
        }}
        href={getExerciseLandingHref(exercise.id, exercise)}
      />
    </div>
  );
};
