import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderPermutation4213Image from "./image.png";

export const spiderPermutation4213Exercise: Exercise = {
  id: "spider_permutation_4213",
  title: "Spider Exercise - 4-2-1-3 Permutation",
  description: "Chromatic exercise using finger permutation 4-2-1-3, developing finger independence and coordination.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Place your left hand fingers on four consecutive frets of one string.",
    "Start playing according to the permutation 4-2-1-3, which means: finger 4, finger 2, finger 1, finger 3.",
    "Repeat the pattern several times, ensuring even attacks and clean sound.",

  ],
  tips: [
    "The 4-2-1 sequence requires special control - it's a backward movement starting with the weakest finger.",
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
        { duration: 0.25, notes: [{ string: 6, fret: 4 }] }, { duration: 0.25, notes: [{ string: 6, fret: 2 }] }, { duration: 0.25, notes: [{ string: 6, fret: 1 }] }, { duration: 0.25, notes: [{ string: 6, fret: 3 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 4 }] }, { duration: 0.25, notes: [{ string: 5, fret: 2 }] }, { duration: 0.25, notes: [{ string: 5, fret: 1 }] }, { duration: 0.25, notes: [{ string: 5, fret: 3 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 4 }] }, { duration: 0.25, notes: [{ string: 4, fret: 2 }] }, { duration: 0.25, notes: [{ string: 4, fret: 1 }] }, { duration: 0.25, notes: [{ string: 4, fret: 3 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 4 }] }, { duration: 0.25, notes: [{ string: 3, fret: 2 }] }, { duration: 0.25, notes: [{ string: 3, fret: 1 }] }, { duration: 0.25, notes: [{ string: 3, fret: 3 }] },
      ]
    },
    { // M2: Fret 1-4 Up (Strings 2, 1) -> Fret 2-5 Up (Strings 6, 5)
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 2, fret: 4 }] }, { duration: 0.25, notes: [{ string: 2, fret: 2 }] }, { duration: 0.25, notes: [{ string: 2, fret: 1 }] }, { duration: 0.25, notes: [{ string: 2, fret: 3 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 4 }] }, { duration: 0.25, notes: [{ string: 1, fret: 2 }] }, { duration: 0.25, notes: [{ string: 1, fret: 1 }] }, { duration: 0.25, notes: [{ string: 1, fret: 3 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 5 }] }, { duration: 0.25, notes: [{ string: 6, fret: 3 }] }, { duration: 0.25, notes: [{ string: 6, fret: 2 }] }, { duration: 0.25, notes: [{ string: 6, fret: 4 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] }, { duration: 0.25, notes: [{ string: 5, fret: 3 }] }, { duration: 0.25, notes: [{ string: 5, fret: 2 }] }, { duration: 0.25, notes: [{ string: 5, fret: 4 }] },
      ]
    }
  ],
  relatedSkills: ["finger_independence", "technique", "picking"],
  image: spiderPermutation4213Image,
}; 