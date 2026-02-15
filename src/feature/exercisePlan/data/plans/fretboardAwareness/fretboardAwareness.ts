import { fretboardMasteryExercise } from "feature/exercisePlan/data/exerises/fretboardMastery/fretboardMastery";
import { naturalNotesMapExercise } from "feature/exercisePlan/data/exerises/naturalNotesMap/naturalNotesMap";
import { randomNoteHuntExercise } from "feature/exercisePlan/data/exerises/randomNoteHunt/randomNoteHunt";

import type { ExercisePlan } from "../../../types/exercise.types";

export const fretboardAwarenessPlan: ExercisePlan = {
  id: "fretboard_awareness",
  title: "Fretboard Awareness",
  description: "Systematic mapping and mastery of the guitar neck using natural notes and melodic phrases.",
  difficulty: "medium",
  category: "theory",
  exercises: [
    naturalNotesMapExercise,
    fretboardMasteryExercise,
    randomNoteHuntExercise
  ],
  userId: "system",
  image: null,
};
