import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";

export const spiderStairsExercise: Exercise = {
  id: "spider_stairs",
  title: "Spider Stairs Exercise",
  description: "Exercise developing finger coordination through string crossing in a stair-like pattern.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Start from the first fret on the E string, using fingers 1-2-3-4.",
    "After playing the fourth note, move to the next string and start from the second fret.",
    "Continue the pattern, moving one fret higher on each subsequent string.",
    "After reaching the last string, perform the exercise in reverse."
  ],
  tips: [
    "Pay special attention to smooth transitions between strings.",
    "Keep all fingers close to the fretboard when changing strings.",
    "Make sure each note rings out clearly and distinctly.",
    "Work on maintaining even tempo, especially during string changes.",

    "Start at a slow tempo and gradually increase speed."
  ],
  metronomeSpeed: {
    min: 60,
    max: 160,
    recommended: 80,
  },
  relatedSkills: ["alternate_picking", "picking", "finger_independence"],
  image: spiderBasicImage,
};