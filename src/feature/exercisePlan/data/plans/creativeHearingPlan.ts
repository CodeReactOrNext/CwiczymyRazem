import type { ExercisePlan } from "../../types/exercise.types";
import { intervalRecognitionExercise } from "../exerises/intervalRecognition/intervalRecognition";
import { motifCreationExercise } from "../exerises/motifCreation/motifCreation";
import { phraseCopyingExercise } from "../exerises/phraseCopying/phraseCopying";
import { playByEarExercise } from "../exerises/playByEar/playByEar";
import { styleAnalysisExercise } from "../exerises/styleAnalysis/styleAnalysis";
import { thematicImprovisationExercise } from "../exerises/thematicImprovisation/thematicImprovisation";

export const creativeHearingPlan: ExercisePlan = {
  id: "creative_hearing_development",
  title: "Rozwój słuchu i kreatywności",
  description: "Kompleksowy plan rozwijający umiejętności słuchowe, kreatywność muzyczną oraz zdolność tworzenia własnego stylu gitarowego.",
  difficulty: "medium",
  category: "creativity",
  exercises: [
    intervalRecognitionExercise,
    playByEarExercise,
    phraseCopyingExercise,
    motifCreationExercise,
    thematicImprovisationExercise,
    styleAnalysisExercise
  ],
  userId: "system",
}; 