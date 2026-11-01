import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import type { PlanDemoExercise } from "feature/landing/components/howItWorks/StepDemos";
import { PLAN_DEMO_PICKS } from "feature/landing/data/planDemoPicks";
import type {
  CategoryDifficultyFilter,
  ExerciseCounts,
} from "feature/practice/utils/autoPlan";
import {
  countExercises,
  filterExercises,
} from "feature/practice/utils/autoPlan";

/** The exercises the Step 01 demo plan is built from. */
const PLAN_DEMO_IDS = [
  "spider_basic",
  "smooth_chord_transitions",
  "fretboard_mastery",
  "guide_tone_voice_leading",
];

/** Everything /how-it-works shows about the library, as plain props. */
export interface HowItWorksStats {
  exerciseCount: number;
  planCount: number;
  categoryCounts: ExerciseCounts;
  planDemoMatches: number[];
  planDemoExercises: PlanDemoExercise[];
}

/**
 * Computed in getStaticProps. The page used to import the exercise catalogue
 * on the client just to count it — about 950 KB of JS for a handful of numbers.
 */
export const getHowItWorksStats = (): HowItWorksStats => ({
  exerciseCount: exercisesAgregat.length,
  planCount: defaultPlans.length,
  categoryCounts: countExercises(exercisesAgregat),
  planDemoMatches: PLAN_DEMO_PICKS.reduce<{
    filter: CategoryDifficultyFilter;
    counts: number[];
  }>(
    ({ filter, counts }, { category, difficulty }) => {
      const next = {
        ...filter,
        [category]: [...(filter[category] ?? []), difficulty],
      };
      return {
        filter: next,
        counts: [...counts, filterExercises(exercisesAgregat, next).length],
      };
    },
    { filter: {}, counts: [exercisesAgregat.length] },
  ).counts,
  planDemoExercises: PLAN_DEMO_IDS.flatMap((id) =>
    exercisesAgregat
      .filter((exercise) => exercise.id === id)
      .map((exercise) => ({
        title: exercise.title,
        minutes: exercise.timeInMinutes,
        category: exercise.category,
        difficulty: exercise.difficulty,
      })),
  ),
});
