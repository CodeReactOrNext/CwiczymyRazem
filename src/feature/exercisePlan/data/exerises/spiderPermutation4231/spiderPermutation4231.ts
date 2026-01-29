import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderPermutation4231Image from "./image.png";

export const spiderPermutation4231Exercise: Exercise = {
  id: "spider_permutation_4231",
  title: "Spider Exercise - 4-2-3-1 Permutation",
  description: "Chromatic exercise using finger permutation 4-2-3-1, developing finger independence and coordination.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Place your left hand fingers on four consecutive frets of one string.",
    "Start playing according to the permutation 4-2-3-1, which means: finger 4, finger 2, finger 3, finger 1.",

  ],
  tips: [
    "Ending the sequence with finger 1 after finger 3 requires precise movement under the other fingers.",
    "Maintain even tempo and spacing between notes - use a metronome.",

  ],
  metronomeSpeed: {
    min: 60,
    max: 180,
    recommended: 80
  },
  tablature: [
    { // M1: Fret 1-4 Up (String 6, 5, 4, 3)
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 4 }] }, { duration: 0.25, notes: [{ string: 6, fret: 2 }] }, { duration: 0.25, notes: [{ string: 6, fret: 3 }] }, { duration: 0.25, notes: [{ string: 6, fret: 1 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 4 }] }, { duration: 0.25, notes: [{ string: 5, fret: 2 }] }, { duration: 0.25, notes: [{ string: 5, fret: 3 }] }, { duration: 0.25, notes: [{ string: 5, fret: 1 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 4 }] }, { duration: 0.25, notes: [{ string: 4, fret: 2 }] }, { duration: 0.25, notes: [{ string: 4, fret: 3 }] }, { duration: 0.25, notes: [{ string: 4, fret: 1 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 4 }] }, { duration: 0.25, notes: [{ string: 3, fret: 2 }] }, { duration: 0.25, notes: [{ string: 3, fret: 3 }] }, { duration: 0.25, notes: [{ string: 3, fret: 1 }] },
      ]
    },
    { // M2: Fret 1-4 Up (Strings 2, 1) -> Fret 2-5 Up (Strings 6, 5)
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 2, fret: 4 }] }, { duration: 0.25, notes: [{ string: 2, fret: 2 }] }, { duration: 0.25, notes: [{ string: 2, fret: 3 }] }, { duration: 0.25, notes: [{ string: 2, fret: 1 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 4 }] }, { duration: 0.25, notes: [{ string: 1, fret: 2 }] }, { duration: 0.25, notes: [{ string: 1, fret: 3 }] }, { duration: 0.25, notes: [{ string: 1, fret: 1 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 5 }] }, { duration: 0.25, notes: [{ string: 6, fret: 3 }] }, { duration: 0.25, notes: [{ string: 6, fret: 4 }] }, { duration: 0.25, notes: [{ string: 6, fret: 2 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] }, { duration: 0.25, notes: [{ string: 5, fret: 3 }] }, { duration: 0.25, notes: [{ string: 5, fret: 4 }] }, { duration: 0.25, notes: [{ string: 5, fret: 2 }] },
      ]
    }
  ],
  relatedSkills: ["finger_independence", "technique", "picking"],
  image: spiderPermutation4231Image,
}; 