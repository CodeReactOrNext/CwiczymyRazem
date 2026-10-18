import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { isClickAnsweredMode } from "feature/exercisePlan/utils/huntModes";

/**
 * The exercises a duel can draw — the owner's pick (2026-10-13), hand-listed
 * rather than filtered, so a new exercise never slips into ranked play by
 * accident. Every one produces a score both players can be compared on:
 *
 * - technique: tab drills graded by the mic, note by note against the part —
 *   the spider family, every finger permutation, and the Riff Vault riffs;
 * - theory: the mic note hunts, plus the whole-neck click hunt;
 * - hearing: the listening quizzes, scored per answer (see earQuizRunStore).
 *
 * Ids only: they are keys in Firestore and never change (renames touch the
 * title), so a duel stored months ago still resolves its exercise.
 */
export const DUEL_EXERCISE_IDS = [
  // Technique — spider, chromatic and box drills
  "speed_burst_chromatic_blitz",
  "spider_x",
  "spider_x_extended",
  "spider_basic",
  "spider_string_skipping",
  "economy_picking_angular",
  "string_skipping_basic",
  "high_register_bends",
  // Technique — every finger permutation
  "spider_permutation_1234",
  "spider_permutation_1243",
  "spider_permutation_1324",
  "spider_permutation_1342",
  "spider_permutation_1423",
  "spider_permutation_1432",
  "spider_permutation_2134",
  "spider_permutation_2143",
  "spider_permutation_2314",
  "spider_permutation_2341",
  "spider_permutation_2413",
  "spider_permutation_2431",
  "spider_permutation_3124",
  "spider_permutation_3142",
  "spider_permutation_3214",
  "spider_permutation_3241",
  "spider_permutation_3412",
  "spider_permutation_3421",
  "spider_permutation_4123",
  "spider_permutation_4132",
  "spider_permutation_4213",
  "spider_permutation_4231",
  "spider_permutation_4312",
  "spider_permutation_4321",
  // Technique — Riff Vault
  "crazy_train_riff_preview",
  "master_of_puppets_riff_preview",
  "sweet_child_o_mine_riff_preview",
  "thunderstruck_riff_preview",
  // Theory — find it on the neck
  "fret_click_whole_chromatic",
  "chromatic_note_hunt",
  "interval_hunt",
  "fretboard_region_hunt",
  // Hearing — listening quizzes
  "ear_chord_quality_advanced",
  "ear_progression_basics",
  "ear_progression_advanced",
] as const;

const byId = new Map(exercisesAgregat.map((exercise) => [exercise.id, exercise]));

/** The pool as exercises, in the order above. Ids that no longer resolve drop out. */
export const DUEL_POOL: Exercise[] = DUEL_EXERCISE_IDS.map((id) => byId.get(id)).filter(
  (exercise): exercise is Exercise => !!exercise,
);

const POOL_IDS = new Set<string>(DUEL_EXERCISE_IDS);

export const isDuelExercise = (exerciseId: string): boolean => POOL_IDS.has(exerciseId);

/**
 * The exercise a stored duel was drawn with — from the whole catalogue, not
 * just the pool, so a duel keeps its title (and stays playable) after its
 * exercise leaves the pool. Drawing stays inside the pool: see `drawDuelExercise`.
 */
export const getDuelExercise = (exerciseId: string): Exercise | null => byId.get(exerciseId) ?? null;

/**
 * Which score a duel run is judged on:
 * - "quiz": the listening quizzes — right answers minus wrong ones, clicked;
 * - "click": click hunts — the hunt's own score, clicked on the neck;
 * - "earTraining": Play by Ear — notes found by ear, heard by the mic;
 * - "mic": everything else — the mic score of the note matcher.
 */
export type DuelScoreKind = "mic" | "earTraining" | "click" | "quiz";

export const duelScoreKind = (
  exercise: Pick<Exercise, "riddleConfig" | "earQuizConfig" | "noteHuntConfig">,
): DuelScoreKind => {
  if (exercise.earQuizConfig) return "quiz";
  if (isClickAnsweredMode(exercise.noteHuntConfig?.mode)) return "click";
  if (exercise.riddleConfig?.mode === "sequenceRepeat") return "earTraining";
  return "mic";
};

/** Whether a run of this exercise needs the microphone on to score at all. */
export const duelNeedsMic = (
  exercise: Pick<Exercise, "riddleConfig" | "earQuizConfig" | "noteHuntConfig">,
): boolean => {
  const kind = duelScoreKind(exercise);
  return kind === "mic" || kind === "earTraining";
};

/** A uniformly random exercise from the pool — each duel draws its own. */
export const drawDuelExercise = (random: () => number = Math.random, pool: Exercise[] = DUEL_POOL): Exercise =>
  pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
