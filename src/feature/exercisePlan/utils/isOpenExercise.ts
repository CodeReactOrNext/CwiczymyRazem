import type { Exercise } from "../types/exercise.types";

/**
 * An "open" exercise has no interactive content to render in the player slot —
 * no tablature, note/chord hunt, ear-training riddle, playalong video, backing
 * track, strumming pattern or image. It's driven purely by its written
 * instructions (e.g. "Smooth Chord Transitions", where the player picks their
 * own chord progression). These used to render an empty player area, which made
 * users think the exercise was broken — so we show an explicit OpenExercisePanel
 * instead. This predicate mirrors the fallback branch in ExerciseContentArea.
 */
export const isOpenExercise = (exercise: Exercise): boolean =>
  !exercise.riddleConfig &&
  !exercise.customGoal &&
  !exercise.rerollCustomGoal &&
  !exercise.rollHuntTarget &&
  !exercise.noteHuntConfig &&
  !(exercise.tablature && exercise.tablature.length > 0) &&
  !exercise.gpFileUrl &&
  !exercise.isPlayalong &&
  !exercise.videoUrl &&
  !exercise.youtubeVideoId &&
  !exercise.requiresBackingTrack &&
  !(exercise.strummingPatterns && exercise.strummingPatterns.length > 0) &&
  !exercise.examBacking &&
  !exercise.image &&
  !exercise.imageUrl;
