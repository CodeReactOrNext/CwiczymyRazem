import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";

/**
 * The exercise library as the model sees it: one line per exercise, nothing
 * the model cannot act on. The whole library is ~11k tokens, which is cheap
 * enough to hand over on every structure call — and it is the reason the
 * generator no longer needs a vector store that goes stale the moment an
 * exercise is added.
 */
/**
 * How an exercise is practised, for the brief's "how do you like to practise"
 * answer: a hunt is a click-to-answer fretboard game, a backing exercise runs
 * over a track, everything else is a drill against the metronome.
 */
export type CatalogKind = "drill" | "backing" | "hunt";

export interface CatalogEntry {
  id: string;
  title: string;
  difficulty: Exercise["difficulty"];
  category: Exercise["category"];
  kind: CatalogKind;
  skills: string[];
  description: string;
  whyItMatters: string;
}

const kindOf = (exercise: Exercise): CatalogKind => {
  if (
    exercise.noteHuntConfig ||
    exercise.rollHuntTarget ||
    exercise.customGoalPrompt
  ) {
    return "hunt";
  }
  return exercise.backingTracks?.length ? "backing" : "drill";
};

/**
 * Play-alongs are left out of every list the generator sees.
 *
 * One is a video to follow for ten or fifteen minutes; a roadmap step is a
 * skill drilled across several sessions against a success criterion it can be
 * measured by. Handing the model a play-along lets it fill a step with "watch
 * this" — and the step's own description, which tells the student to play the
 * exercise by name and says what to listen for, has nothing to say about it.
 *
 * The library's own `isPlayalong` flag is the filter, so a play-along added
 * later stays out of here without anybody remembering to update a list of ids.
 */
const entries: CatalogEntry[] = exercisesAgregat
  .filter((exercise) => !exercise.isPlayalong)
  .map((exercise) => ({
    id: exercise.id,
    title: exercise.title,
    difficulty: exercise.difficulty,
    category: exercise.category,
    kind: kindOf(exercise),
    skills: exercise.relatedSkills ?? [],
    description: exercise.description,
    whyItMatters: exercise.whyItMatters ?? "",
  }));

const byId = new Map(entries.map((entry) => [entry.id, entry]));

export const EXERCISE_CATALOG: readonly CatalogEntry[] = entries;

export const findCatalogEntry = (id: string | null | undefined) =>
  id ? byId.get(id) : undefined;

export const isCatalogExerciseId = (id: string): boolean => byId.has(id);

/** The line format the prompts quote back, so the model has one shape to match. */
const catalogLine = (entry: CatalogEntry) =>
  `${entry.id} | ${entry.title} | ${entry.difficulty} | ${entry.category} | ${entry.skills.join(",") || "-"} | ${entry.description}`;

/**
 * The library for a prompt. `keep` narrows it — to the kinds the student said
 * they like to practise — but never below the whole library: a filter that
 * would leave nothing hands the model everything instead of an empty list.
 */
export const renderExerciseCatalog = (
  keep?: (entry: CatalogEntry) => boolean,
): string => {
  const kept = keep ? entries.filter(keep) : entries;
  const listed = kept.length ? kept : entries;
  return [
    "id | title | difficulty | category | skills | what it trains",
    ...listed.map(catalogLine),
  ].join("\n");
};

/**
 * Which library difficulties fit a roadmap level. "beginner" is the handful of
 * first-week exercises; "easy" is the bulk of what a beginner roadmap uses.
 */
export const DIFFICULTY_FOR_LEVEL: Record<string, Exercise["difficulty"][]> = {
  "Absolute Beginner": ["beginner", "easy"],
  Beginner: ["beginner", "easy", "medium"],
  Intermediate: ["easy", "medium", "hard"],
  Advanced: ["medium", "hard"],
};
