import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";

/**
 * The exercises a duel can draw — about a fifth of the catalogue, hand-picked
 * rather than filtered, so a new exercise never slips into ranked play by
 * accident. All medium or hard, and every one is scored by the microphone:
 *
 * - technique: tab drills graded note by note against the written part;
 * - theory: the mic note hunts (find the note / degree / chord tone by ear on
 *   the neck before the clock rotates it);
 * - hearing: Play by Ear — the app plays a phrase, you play it back.
 *
 * Left out on purpose: the click-to-answer quizzes and click hunts (no mic, and
 * the quizzes keep no score on the server at all), play-alongs and untracked
 * drills (nothing to compare), and bend drills scored on pitch (the detector
 * reads low strings sharp, which a ranked match should not hinge on).
 *
 * Ids only: they are keys in Firestore and never change (renames touch the
 * title), so a duel stored months ago still resolves its exercise.
 */
export const DUEL_EXERCISE_IDS = [
  // Technique — hard
  "speed_burst_chromatic_blitz",
  "spider_stairs_hard",
  "chicken_pickin",
  "hybrid_picking_independence",
  "legato_continuous_flow",
  "string_skipping_basic",
  "string_skipping_melodic",
  "metal_tremolo_picking",
  "economy_picking_angular",
  "string_skipping_arpeggios",
  "legato_hammer_pull_run",
  "tapping_triadic_cascade",
  "jazz_chord_melody",
  "rhythm_training_hard",
  "meter_switch_12_8_to_4_4",
  "meter_switch_4_4_to_6_8_pulse",
  "sweep_neoclassical",
  "sweep_picking_3_string",
  "tapping_melodic_lines",
  "legato_trill_sprint",
  "vibrato_finger_isolation",
  "fret_stretch_drill",
  "sweep_5_string_cascade",
  // Technique — medium, the demanding end of it
  "sweet_child_o_mine_riff_preview",
  "crazy_train_riff_preview",
  "thunderstruck_riff_preview",
  "master_of_puppets_riff_preview",
  "metal_gallop",
  "legato_sextuplets_4_5_7",
  "alternate_picking_cross_string",
  "meter_regroup_7_8",
  "meter_switch_4_4_to_7_8",
  "spider_x_extended",
  "pinky_power_drill",
  "chromatic_accents",
  // Theory — mic hunts
  "string_sweep_low_e",
  "string_sweep_a",
  "string_sweep_d",
  "string_sweep_g",
  "string_sweep_b",
  "whole_neck_sweep",
  "fretboard_region_hunt",
  "interval_hunt",
  "build_the_chord",
  "chord_degree_hunt_sevenths",
  "chord_degree_hunt_tensions",
  "chord_degree_hunt_changes",
  // Hearing — played back on the guitar, heard by the mic
  "earTrainingMedium",
  "earTrainingHard",
] as const;

const byId = new Map(
  exercisesAgregat.map((exercise) => [exercise.id, exercise]),
);

/** The pool as exercises, in the order above. Ids that no longer resolve drop out. */
export const DUEL_POOL: Exercise[] = DUEL_EXERCISE_IDS.map((id) =>
  byId.get(id),
).filter((exercise): exercise is Exercise => !!exercise);

const POOL_IDS = new Set<string>(DUEL_EXERCISE_IDS);

export const isDuelExercise = (exerciseId: string): boolean =>
  POOL_IDS.has(exerciseId);

export const getDuelExercise = (exerciseId: string): Exercise | null =>
  (isDuelExercise(exerciseId) && byId.get(exerciseId)) || null;

/**
 * Which score a duel run is judged on. Play by Ear keeps its own score (notes
 * found by ear); everything else is the mic score of the note matcher.
 */
export const duelScoreKind = (
  exercise: Pick<Exercise, "riddleConfig">,
): "mic" | "earTraining" =>
  exercise.riddleConfig?.mode === "sequenceRepeat" ? "earTraining" : "mic";

/** A uniformly random exercise from the pool — each duel draws its own. */
export const drawDuelExercise = (
  random: () => number = Math.random,
  pool: Exercise[] = DUEL_POOL,
): Exercise =>
  pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
