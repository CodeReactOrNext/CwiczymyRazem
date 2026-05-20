import { openGRepetitionExercise } from "feature/exercisePlan/data/exerises/openGRepetition/openGRepetition";
import { randomNoteHuntExercise } from "feature/exercisePlan/data/exerises/randomNoteHunt/randomNoteHunt";
import { spiderChromaticsExercise } from "feature/exercisePlan/data/exerises/spiderChromatics/spiderChromatics";
import { stringRepetitionExercise } from "feature/exercisePlan/data/exerises/stringRepetition/stringRepetition";
import { nakedToneMelodyExercise } from "feature/exercisePlan/data/exerises/nakedToneMelody/nakedToneMelody";
import { strummingBasicExercise } from "feature/exercisePlan/data/exerises/strummingBasic/strummingBasic";
import { chordPracticeExercise } from "feature/exercisePlan/data/exerises/chordPractice/chordPractice";
import { quarterNotesDrillExercise } from "feature/exercisePlan/data/exerises/quarterNotesDrill/quarterNotesDrill";

import type { ExercisePlan } from "../../../types/exercise.types";

export const beginnerDailyExercisesPlan: ExercisePlan = {
  id: "beginner_daily_exercises",
  title: "Beginner: Daily Exercises",
  description: "Perfect starting point for someone who just picked up the guitar. Focuses on basic string awareness and coordination.",
  difficulty: "easy",
  category: "technique",
  exercises: [
    openGRepetitionExercise,
    stringRepetitionExercise,
    spiderChromaticsExercise,
    randomNoteHuntExercise,

  ],
  userId: "system",
  image: null, // Image will be added once approved or handled
};

export const megaBeginnerFirstStepsPlan: ExercisePlan = {
  id: "mega_beginner_first_steps",
  title: "Mega Beginner: First Steps",
  description: "Super simple exercises perfect for absolute beginners just starting their guitar journey. Focuses on melody, strumming, and basic chords.",
  difficulty: "easy",
  category: "technique",
  exercises: [
    nakedToneMelodyExercise,
    strummingBasicExercise,
    chordPracticeExercise,
    quarterNotesDrillExercise,
  ],
  userId: "system",
  image: null,
};
