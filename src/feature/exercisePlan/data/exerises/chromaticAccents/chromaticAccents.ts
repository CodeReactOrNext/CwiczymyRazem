import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import chromaticAccentsImage from "./image.png";


export const chromaticAccentsExercise: Exercise = {
  id: "chromatic_accents",
  title: "Chromatic Accent Dynamics",
  description: "Exercise developing dynamic control through playing chromatic sequences with shifting accents.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Choose a section of the chromatic scale (e.g., from 5th to 9th fret on one string).",
    "Play a sequence of chromatic sixteenth notes, strongly accenting the FIRST note of each group of four.",
    "After mastering, shift the accent to the SECOND note of each group, keeping other notes quieter.",
    "Continue by shifting the accent to the THIRD, then FOURTH note in each group.",
    "Try combining different accent patterns, e.g., accent notes 1 and 3, then 2 and 4."
  ],
  tips: [
    "The difference between accented and non-accented notes should be clearly audible.",
    "Control your pick attack - stronger for accents, lighter for other notes.",
    "Work with a metronome to maintain even timing despite dynamic changes.",
    "Initially practice slowly, increasing tempo only when you have full control over dynamics.",

  ],
  metronomeSpeed: {
    min: 60,
    max: 140,
    recommended: 80
  }, 
  relatedSkills: [ "alternate_picking", "rhythm", "technique"],
  image: chromaticAccentsImage,
}; 