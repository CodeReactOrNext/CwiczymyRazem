import { chordPracticeExercise } from "feature/exercisePlan/data/exerises/chordPractice/chordPractice";
import { nakedToneMelodyExercise } from "feature/exercisePlan/data/exerises/nakedToneMelody/nakedToneMelody";
import { openGRepetitionExercise } from "feature/exercisePlan/data/exerises/openGRepetition/openGRepetition";
import { randomNoteHuntExercise } from "feature/exercisePlan/data/exerises/randomNoteHunt/randomNoteHunt";
import { spiderQuarterNotesExercise } from "feature/exercisePlan/data/exerises/spiderQuarterNotes/spiderQuarterNotes";
import { stringRepetitionExercise } from "feature/exercisePlan/data/exerises/stringRepetition/stringRepetition";
import { strummingBasicExercise } from "feature/exercisePlan/data/exerises/strummingBasic/strummingBasic";

import type { ExercisePlan } from "../../../types/exercise.types";

export const beginnerDailyExercisesPlan: ExercisePlan = {
  id: "beginner_daily_exercises",
  icon: "graduation",
  color: "lime",
  title: "Beginner: Daily Exercises",
  description: "Single notes only, no chords: keep time on open strings, find notes on the neck and run the spider drill. A daily habit for finger control.",
  difficulty: "beginner",
  category: "technique",
  exercises: [
    openGRepetitionExercise,
    stringRepetitionExercise,
    randomNoteHuntExercise,
    spiderQuarterNotesExercise,
  ],
  userId: "system",
  image: null, // Image will be added once approved or handled
};

export const megaBeginnerFirstStepsPlan: ExercisePlan = {
  id: "mega_beginner_first_steps",
  icon: "star",
  color: "emerald",
  title: "Absolute Beginner: First Steps",
  description: "A taste of everything: open strings, a slow melody, steady strumming and your first chords. Pick this if you have never played before.",
  difficulty: "beginner",
  category: "technique",
  exercises: [
    stringRepetitionExercise,
    nakedToneMelodyExercise,
    strummingBasicExercise,
    chordPracticeExercise,
  ],
  userId: "system",
  image: null,
};
