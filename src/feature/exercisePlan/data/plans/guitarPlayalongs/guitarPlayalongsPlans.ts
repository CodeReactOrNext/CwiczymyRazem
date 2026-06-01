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

const makePlan = (exercise: Exercise): ExercisePlan => ({
  id: exercise.id,
  title: exercise.title,
  description: exercise.description,
  difficulty: exercise.difficulty,
  category: exercise.category,
  exercises: [exercise],
  userId: "GuitarPlayalongs",
  image: null,
  author,
});

export const gpPentatonic10MinWorkoutPlan = makePlan(gpPentatonic10MinWorkoutExercise);
export const gpSweepPicking15MinPlan = makePlan(gpSweepPicking15MinExercise);
export const gpSpeedBuilderPart1Plan = makePlan(gpSpeedBuilderPart1Exercise);
export const gpStaminaPickingWorkoutPlan = makePlan(gpStaminaPickingWorkoutExercise);
export const gpGallopPicking10LevelsPlan = makePlan(gpGallopPicking10LevelsExercise);
export const gpAlternatePickingSpeedBuilderPlan = makePlan(gpAlternatePickingSpeedBuilderExercise);
export const gpRockMetalRiffsPlan = makePlan(gpRockMetalRiffsExercise);
export const gpMusicTheoryEssentialPlan = makePlan(gpMusicTheoryEssentialExercise);
export const gpDrop2ChordsArpeggiosPlan = makePlan(gpDrop2ChordsArpeggiosExercise);
export const gpPentatonicTutorialPlan = makePlan(gpPentatonicTutorialExercise);

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
