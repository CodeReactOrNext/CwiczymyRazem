import { chromaticNoteHuntExercise } from "feature/exercisePlan/data/exerises/chromaticNoteHunt/chromaticNoteHunt";
import { fretboardMasteryExercise } from "feature/exercisePlan/data/exerises/fretboardMastery/fretboardMastery";
import { fretboardRegionHuntExercise } from "feature/exercisePlan/data/exerises/fretboardRegionHunt/fretboardRegionHunt";
import { randomNoteHuntExercise } from "feature/exercisePlan/data/exerises/randomNoteHunt/randomNoteHunt";

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
    chromaticNoteHuntExercise,
    fretboardRegionHuntExercise,
    fretboardMasteryExercise
  ],
  userId: "system",
  image: null,
};
