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
  tablature: [
    { // M1: Going Up (Strings 6, 5, 4, 3)
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 1 }] }, { duration: 0.25, notes: [{ string: 6, fret: 2 }] }, { duration: 0.25, notes: [{ string: 6, fret: 3 }] }, { duration: 0.25, notes: [{ string: 6, fret: 4 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 2 }] }, { duration: 0.25, notes: [{ string: 5, fret: 3 }] }, { duration: 0.25, notes: [{ string: 5, fret: 4 }] }, { duration: 0.25, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 3 }] }, { duration: 0.25, notes: [{ string: 4, fret: 4 }] }, { duration: 0.25, notes: [{ string: 4, fret: 5 }] }, { duration: 0.25, notes: [{ string: 4, fret: 6 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 4 }] }, { duration: 0.25, notes: [{ string: 3, fret: 5 }] }, { duration: 0.25, notes: [{ string: 3, fret: 6 }] }, { duration: 0.25, notes: [{ string: 3, fret: 7 }] },
      ]
    },
    { // M2: Going Up (Strings 2, 1) -> Descending
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] }, { duration: 0.25, notes: [{ string: 2, fret: 6 }] }, { duration: 0.25, notes: [{ string: 2, fret: 7 }] }, { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 6 }] }, { duration: 0.25, notes: [{ string: 1, fret: 7 }] }, { duration: 0.25, notes: [{ string: 1, fret: 8 }] }, { duration: 0.25, notes: [{ string: 1, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 9 }] }, { duration: 0.25, notes: [{ string: 1, fret: 8 }] }, { duration: 0.25, notes: [{ string: 1, fret: 7 }] }, { duration: 0.25, notes: [{ string: 1, fret: 6 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] }, { duration: 0.25, notes: [{ string: 2, fret: 7 }] }, { duration: 0.25, notes: [{ string: 2, fret: 6 }] }, { duration: 0.25, notes: [{ string: 2, fret: 5 }] },
      ]
    },
    { // M3: Descending
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 3, fret: 7 }] }, { duration: 0.25, notes: [{ string: 3, fret: 6 }] }, { duration: 0.25, notes: [{ string: 3, fret: 5 }] }, { duration: 0.25, notes: [{ string: 3, fret: 4 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 6 }] }, { duration: 0.25, notes: [{ string: 4, fret: 5 }] }, { duration: 0.25, notes: [{ string: 4, fret: 4 }] }, { duration: 0.25, notes: [{ string: 4, fret: 3 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] }, { duration: 0.25, notes: [{ string: 5, fret: 4 }] }, { duration: 0.25, notes: [{ string: 5, fret: 3 }] }, { duration: 0.25, notes: [{ string: 5, fret: 2 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 4 }] }, { duration: 0.25, notes: [{ string: 6, fret: 3 }] }, { duration: 0.25, notes: [{ string: 6, fret: 2 }] }, { duration: 0.25, notes: [{ string: 6, fret: 1 }] },
      ]
    }
  ],
  relatedSkills: ["alternate_picking", "picking", "finger_independence"],
  image: spiderBasicImage,
};