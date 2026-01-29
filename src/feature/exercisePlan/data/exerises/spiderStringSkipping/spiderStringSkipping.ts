import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";


export const SpiderStringSkippingExercise: Exercise = {
  id: "spider_string_skipping",
  title: "String Skipping Spider Exercise",
  description: "Exercise developing coordination in string skipping and right hand precision.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Start from the first fret on the E string, then skip one string.",
    "Perform the 1-2-3-4 pattern on alternating strings.",
    "After each repetition, move one fret higher.",
    "Pay special attention to clean notes when skipping strings."
  ],
  tips: [
    "Control pick movement, avoiding hitting skipped strings.",
    "Maintain stable right hand position during skips.",
    "Start with slow tempo, focusing on skip precision.",
    "Experiment with different string combinations.",
    "Practice also in reverse (from high to low strings)."
  ],
  metronomeSpeed: {
    min: 60,
    max: 160,
    recommended: 80,
  },
  tablature: [
    { // M1: String Skipping Up (6->4, 5->3)
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 1 }] }, { duration: 0.25, notes: [{ string: 6, fret: 2 }] }, { duration: 0.25, notes: [{ string: 6, fret: 3 }] }, { duration: 0.25, notes: [{ string: 6, fret: 4 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 1 }] }, { duration: 0.25, notes: [{ string: 4, fret: 2 }] }, { duration: 0.25, notes: [{ string: 4, fret: 3 }] }, { duration: 0.25, notes: [{ string: 4, fret: 4 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 1 }] }, { duration: 0.25, notes: [{ string: 5, fret: 2 }] }, { duration: 0.25, notes: [{ string: 5, fret: 3 }] }, { duration: 0.25, notes: [{ string: 5, fret: 4 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 1 }] }, { duration: 0.25, notes: [{ string: 3, fret: 2 }] }, { duration: 0.25, notes: [{ string: 3, fret: 3 }] }, { duration: 0.25, notes: [{ string: 3, fret: 4 }] },
      ]
    },
    { // M2: String Skipping Up (4->2, 3->1)
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 4, fret: 2 }] }, { duration: 0.25, notes: [{ string: 4, fret: 3 }] }, { duration: 0.25, notes: [{ string: 4, fret: 4 }] }, { duration: 0.25, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 2 }] }, { duration: 0.25, notes: [{ string: 2, fret: 3 }] }, { duration: 0.25, notes: [{ string: 2, fret: 4 }] }, { duration: 0.25, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 2 }] }, { duration: 0.25, notes: [{ string: 3, fret: 3 }] }, { duration: 0.25, notes: [{ string: 3, fret: 4 }] }, { duration: 0.25, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 2 }] }, { duration: 0.25, notes: [{ string: 1, fret: 3 }] }, { duration: 0.25, notes: [{ string: 1, fret: 4 }] }, { duration: 0.25, notes: [{ string: 1, fret: 5 }] },
      ]
    }
  ],
  relatedSkills: ["alternate_picking", "picking", "string_skipping", "finger_independence"],
  image: spiderBasicImage,
};