import type {
  DifficultyLevel,
  Exercise,
  ExerciseCategory,
} from "feature/exercisePlan/types/exercise.types";

/** Categories the generator draws from — `mixed` is a plan-level label, never an exercise's own category. */
export const PLAN_CATEGORIES: ExerciseCategory[] = [
  "technique",
  "theory",
  "creativity",
  "hearing",
];

export const PLAN_DIFFICULTIES: DifficultyLevel[] = [
  "beginner",
  "easy",
  "medium",
  "hard",
];

/**
 * Difficulties accepted inside each category, e.g. `{ technique: ["medium"], hearing: ["easy"] }`
 * = "medium technique and easy hearing exercises, nothing else". A category with a missing or
 * empty list is left out of the draw; a filter with nothing picked anywhere means "no filter".
 */
export type CategoryDifficultyFilter = Partial<
  Record<ExerciseCategory, DifficultyLevel[]>
>;

/** How many exercises exist per category × difficulty pair — feeds the counters in the grid. */
export type ExerciseCounts = Partial<
  Record<ExerciseCategory, Partial<Record<DifficultyLevel, number>>>
>;

export const isFilterEmpty = (filter: CategoryDifficultyFilter): boolean =>
  Object.values(filter).every((difficulties) => !difficulties?.length);

export const isSelected = (
  filter: CategoryDifficultyFilter,
  category: ExerciseCategory,
  difficulty: DifficultyLevel,
): boolean => filter[category]?.includes(difficulty) ?? false;

/** One cell of the grid: adds or removes a single difficulty inside a single category. */
export const toggleDifficulty = (
  filter: CategoryDifficultyFilter,
  category: ExerciseCategory,
  difficulty: DifficultyLevel,
): CategoryDifficultyFilter => {
  const current = filter[category] ?? [];

  return {
    ...filter,
    [category]: current.includes(difficulty)
      ? current.filter((level) => level !== difficulty)
      : PLAN_DIFFICULTIES.filter(
          (level) => level === difficulty || current.includes(level),
        ),
  };
};

/** One row: clears the category when every difficulty is already picked, otherwise picks them all. */
export const toggleCategory = (
  filter: CategoryDifficultyFilter,
  category: ExerciseCategory,
): CategoryDifficultyFilter => ({
  ...filter,
  [category]:
    filter[category]?.length === PLAN_DIFFICULTIES.length
      ? []
      : [...PLAN_DIFFICULTIES],
});

/** One column: turns a difficulty on across every category, or off everywhere when they all have it. */
export const toggleDifficultyEverywhere = (
  filter: CategoryDifficultyFilter,
  difficulty: DifficultyLevel,
): CategoryDifficultyFilter => {
  const shouldSelect = !PLAN_CATEGORIES.every((category) =>
    isSelected(filter, category, difficulty),
  );

  return PLAN_CATEGORIES.reduce<CategoryDifficultyFilter>(
    (next, category) =>
      isSelected(next, category, difficulty) === shouldSelect
        ? next
        : toggleDifficulty(next, category, difficulty),
    filter,
  );
};

/** "Select all": every category × difficulty pair that actually has exercises behind it. */
export const selectAllAvailable = (
  counts: ExerciseCounts,
): CategoryDifficultyFilter =>
  PLAN_CATEGORIES.reduce<CategoryDifficultyFilter>((filter, category) => {
    const difficulties = PLAN_DIFFICULTIES.filter(
      (difficulty) => (counts[category]?.[difficulty] ?? 0) > 0,
    );

    return difficulties.length > 0 ? { ...filter, [category]: difficulties } : filter;
  }, {});

/** Whether every pickable pair is already picked — nothing left for "select all" to do. */
export const isEverythingSelected = (
  filter: CategoryDifficultyFilter,
  counts: ExerciseCounts,
): boolean =>
  Object.entries(selectAllAvailable(counts)).every(([category, difficulties]) =>
    (difficulties ?? []).every((difficulty) =>
      isSelected(filter, category as ExerciseCategory, difficulty),
    ),
  );

export const matchesFilter = (
  exercise: Exercise,
  filter: CategoryDifficultyFilter,
): boolean =>
  isFilterEmpty(filter) ||
  isSelected(filter, exercise.category, exercise.difficulty);

export const filterExercises = (
  exercises: Exercise[],
  filter: CategoryDifficultyFilter,
): Exercise[] =>
  exercises.filter((exercise) => !!exercise && matchesFilter(exercise, filter));

export const countExercises = (exercises: Exercise[]): ExerciseCounts =>
  exercises.reduce<ExerciseCounts>((counts, exercise) => {
    if (!exercise) return counts;

    const byDifficulty = counts[exercise.category] ?? {};
    byDifficulty[exercise.difficulty] =
      (byDifficulty[exercise.difficulty] ?? 0) + 1;
    counts[exercise.category] = byDifficulty;

    return counts;
  }, {});

const shuffle = <T>(items: T[], random: () => number): T[] => {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

/**
 * Fills `minutes` with exercises drawn round-robin from every category in the pool, so a plan
 * filtered to "medium technique + easy hearing" really contains both instead of being swamped
 * by whichever category happens to hold the most exercises.
 */
export const pickExercisesWithinTime = (
  pool: Exercise[],
  minutes: number,
  random: () => number = Math.random,
): Exercise[] => {
  const available = pool.filter((exercise) => !!exercise);
  if (available.length === 0) return [];

  const categories = PLAN_CATEGORIES.filter((category) =>
    available.some((exercise) => exercise.category === category),
  );
  const queues = [...categories, "mixed" as ExerciseCategory]
    .map((category) =>
      shuffle(
        available.filter((exercise) => exercise.category === category),
        random,
      ),
    )
    .filter((queue) => queue.length > 0);

  const picked: Exercise[] = [];
  let totalTime = 0;
  let pickedInPass = true;

  while (pickedInPass && totalTime < minutes * 0.9) {
    pickedInPass = false;

    for (const queue of queues) {
      while (queue.length > 0) {
        const exercise = queue.shift() as Exercise;

        // Time only shrinks from here, so an exercise that does not fit now never will.
        if (totalTime + exercise.timeInMinutes <= minutes) {
          picked.push(exercise);
          totalTime += exercise.timeInMinutes;
          pickedInPass = true;
          break;
        }
      }

      if (totalTime >= minutes * 0.9) break;
    }
  }

  if (picked.length === 0) {
    // Nothing fits the slot — still hand back the shortest exercise rather than an empty plan.
    return [
      available.reduce((shortest, exercise) =>
        exercise.timeInMinutes < shortest.timeInMinutes ? exercise : shortest,
      ),
    ];
  }

  return picked;
};
