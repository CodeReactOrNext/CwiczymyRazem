import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";


export const spiderStairsHardExercise: Exercise = {
  id: "spider_stairs_hard",
  title: "Advanced Spider Stairs Exercise",
  description: "Advanced version of the stairs exercise with wider note intervals and faster tempo.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Start from the first fret on the E string, using fingers 1-2-4.",
    "Move to the next string shifting two frets higher.",
    "Continue the pattern until the highest string, increasing finger stretch.",
    "Return the same way down, maintaining movement precision."
  ],
  tips: [
    "Pay special attention to precision with wider stretches.",
    "Maintain proper wrist position despite larger distances.",
    "Control pressure - it's easy to press too hard with wider stretches.",
    "If you feel discomfort, reduce tempo.",

  ],
  metronomeSpeed: {
    min: 60,
    max: 200,
    recommended: 90,
  },
  tablature: [
    { // M1: Going Up (Strings 6, 5, 4, 3) - 1/3 (Triplet-like but keep 0.25 for simplicity as the pattern is 3 notes)
      // Actually let's use 1/3 duration for true triplets if we want, but 0.25 is safer for the engine.
      // The exercise says "4-1-2-3" or "1-2-4". If it's 1-2-4, it's 3 notes.
      // Let's stick to 1/3 duration to make it swing properly.
      timeSignature: [4, 4],
      beats: [
        { duration: 1 / 3, notes: [{ string: 6, fret: 1 }] }, { duration: 1 / 3, notes: [{ string: 6, fret: 2 }] }, { duration: 1 / 3, notes: [{ string: 6, fret: 4 }] },
        { duration: 1 / 3, notes: [{ string: 5, fret: 3 }] }, { duration: 1 / 3, notes: [{ string: 5, fret: 4 }] }, { duration: 1 / 3, notes: [{ string: 5, fret: 6 }] },
        { duration: 1 / 3, notes: [{ string: 4, fret: 5 }] }, { duration: 1 / 3, notes: [{ string: 4, fret: 6 }] }, { duration: 1 / 3, notes: [{ string: 4, fret: 8 }] },
        { duration: 1 / 3, notes: [{ string: 3, fret: 7 }] }, { duration: 1 / 3, notes: [{ string: 3, fret: 8 }] }, { duration: 1 / 3, notes: [{ string: 3, fret: 10 }] },
      ]
    },
    { // M2: Going Up (Strings 2, 1) -> Descending
      timeSignature: [4, 4],
      beats: [
        { duration: 1 / 3, notes: [{ string: 2, fret: 9 }] }, { duration: 1 / 3, notes: [{ string: 2, fret: 10 }] }, { duration: 1 / 3, notes: [{ string: 2, fret: 12 }] },
        { duration: 1 / 3, notes: [{ string: 1, fret: 11 }] }, { duration: 1 / 3, notes: [{ string: 1, fret: 12 }] }, { duration: 1 / 3, notes: [{ string: 1, fret: 14 }] },
        { duration: 1 / 3, notes: [{ string: 1, fret: 14 }] }, { duration: 1 / 3, notes: [{ string: 1, fret: 12 }] }, { duration: 1 / 3, notes: [{ string: 1, fret: 11 }] },
        { duration: 1 / 3, notes: [{ string: 2, fret: 12 }] }, { duration: 1 / 3, notes: [{ string: 2, fret: 10 }] }, { duration: 1 / 3, notes: [{ string: 2, fret: 9 }] },
      ]
    }
  ],
  relatedSkills: ["alternate_picking", "picking", "legato", "technique"],
  image: spiderBasicImage,
};