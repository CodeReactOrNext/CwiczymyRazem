import {
  gpAlternatePickingSpeedBuilderExercise,
  gpDrop2ChordsArpeggiosExercise,
  gpGallopPicking10LevelsExercise,
  gpMusicTheoryEssentialExercise,
  gpPentatonic10MinWorkoutExercise,
  gpPentatonicTutorialExercise,
  gpRockMetalRiffsExercise,
  gpSpeedBuilderPart1Exercise,
  gpStaminaPickingWorkoutExercise,
  gpSweepPicking15MinExercise,
} from "feature/exercisePlan/data/exerises/guitarPlayalongs/guitarPlayalongs";
import authorAvatar from "public/images/avatars/guitarplayalogns.jpg";

import type { Exercise, ExercisePlan } from "../../../types/exercise.types";

const author = {
  name: "Guitar Playalongs",
  avatar: authorAvatar,
};

const makePlan = (
  exercise: Exercise,
  appearance?: { icon: string; color: string },
): ExercisePlan => ({
  id: exercise.id,
  title: exercise.title,
  description: exercise.description,
  difficulty: exercise.difficulty,
  category: exercise.category,
  exercises: [exercise],
  userId: "GuitarPlayalongs",
  image: null,
  author,
  ...appearance,
});

export const gpPentatonic10MinWorkoutPlan = makePlan(gpPentatonic10MinWorkoutExercise, { icon: "guitar", color: "blue" });
export const gpSweepPicking15MinPlan = makePlan(gpSweepPicking15MinExercise, { icon: "zap", color: "cyan" });
export const gpSpeedBuilderPart1Plan = makePlan(gpSpeedBuilderPart1Exercise, { icon: "rocket", color: "red" });
export const gpStaminaPickingWorkoutPlan = makePlan(gpStaminaPickingWorkoutExercise, { icon: "dumbbell", color: "amber" });
export const gpGallopPicking10LevelsPlan = makePlan(gpGallopPicking10LevelsExercise, { icon: "gauge", color: "orange" });
export const gpAlternatePickingSpeedBuilderPlan = makePlan(gpAlternatePickingSpeedBuilderExercise, { icon: "zap", color: "rose" });
export const gpRockMetalRiffsPlan = makePlan(gpRockMetalRiffsExercise, { icon: "flame", color: "red" });
export const gpMusicTheoryEssentialPlan = makePlan(gpMusicTheoryEssentialExercise, { icon: "brain", color: "indigo" });
export const gpDrop2ChordsArpeggiosPlan = makePlan(gpDrop2ChordsArpeggiosExercise, { icon: "piano", color: "purple" });
export const gpPentatonicTutorialPlan = makePlan(gpPentatonicTutorialExercise, { icon: "graduation", color: "teal" });

export const guitarPlayalongsPlans: ExercisePlan[] = [
  gpPentatonic10MinWorkoutPlan,
  gpSweepPicking15MinPlan,
  gpSpeedBuilderPart1Plan,
  gpStaminaPickingWorkoutPlan,
  gpGallopPicking10LevelsPlan,
  gpAlternatePickingSpeedBuilderPlan,
  gpRockMetalRiffsPlan,
  gpMusicTheoryEssentialPlan,
  gpDrop2ChordsArpeggiosPlan,
  gpPentatonicTutorialPlan,
];
