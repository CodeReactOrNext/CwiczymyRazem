import { fretboardRegionHuntExercise } from "feature/exercisePlan/data/exerises/fretboardRegionHunt/fretboardRegionHunt";
import { intervalHuntExercise } from "feature/exercisePlan/data/exerises/intervalHunt/intervalHunt";
import { randomNoteHuntExercise } from "feature/exercisePlan/data/exerises/randomNoteHunt/randomNoteHunt";
import { wholeNeckHuntExercise } from "feature/exercisePlan/data/exerises/wholeNeckHunt/wholeNeckHunt";

import type { ExercisePlan } from "../../../types/exercise.types";

export const fretboardAwarenessPlan: ExercisePlan = {
  id: "fretboard_awareness",
  icon: "target",
  color: "emerald",
  title: "Fretboard Awareness",
  description: "Systematic mapping and mastery of the guitar neck through note-finding drills across positions and fretboard regions.",
  difficulty: "medium",
  category: "theory",
  exercises: [
    randomNoteHuntExercise,
    intervalHuntExercise,
    fretboardRegionHuntExercise,
    wholeNeckHuntExercise,
  ],
  userId: "system",
  image: null,
};
