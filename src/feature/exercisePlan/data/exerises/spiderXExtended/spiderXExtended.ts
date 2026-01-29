import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";


export const spiderXExtendedExercise: Exercise = {
  id: "spider_x_extended",
  title: "Extended Spider X Exercise",
  description: "Advanced version of X exercise with wider stretches and complex patterns.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 15,
  instructions: [
    "Start with basic X pattern, then extend the layout by an additional fret.",
    "Perform the sequence on three adjacent strings.",
    "Add direction changes within the pattern.",
    "Combine different variants of the extended X pattern."
  ],
  tips: [
    "Pay special attention to ergonomics with wider stretches.",
    "Adjust wrist position for the extended layout.",
    "Take breaks at first signs of fatigue.",
    "Gradually increase pattern complexity.",
    "Regularly return to basic version for comparison."
  ],
  metronomeSpeed: {
    min: 60,
    max: 180,
    recommended: 90,
  },
  tablature: [
    { // M1: Extended X (Stretch) on Strings 6 & 5
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 1 }] }, { duration: 0.25, notes: [{ string: 5, fret: 4 }] }, { duration: 0.25, notes: [{ string: 6, fret: 4 }] }, { duration: 0.25, notes: [{ string: 5, fret: 1 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 2 }] }, { duration: 0.25, notes: [{ string: 5, fret: 5 }] }, { duration: 0.25, notes: [{ string: 6, fret: 5 }] }, { duration: 0.25, notes: [{ string: 5, fret: 2 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 3 }] }, { duration: 0.25, notes: [{ string: 5, fret: 6 }] }, { duration: 0.25, notes: [{ string: 6, fret: 6 }] }, { duration: 0.25, notes: [{ string: 5, fret: 3 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 4 }] }, { duration: 0.25, notes: [{ string: 5, fret: 7 }] }, { duration: 0.25, notes: [{ string: 6, fret: 7 }] }, { duration: 0.25, notes: [{ string: 5, fret: 4 }] },
      ]
    },
    { // M2: 3-String Extended X (Diagonal)
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 1 }] }, { duration: 0.25, notes: [{ string: 5, fret: 2 }] }, { duration: 0.25, notes: [{ string: 4, fret: 3 }] }, { duration: 0.25, notes: [{ string: 6, fret: 3 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 2 }] }, { duration: 0.25, notes: [{ string: 4, fret: 1 }] }, { duration: 0.25, notes: [{ string: 5, fret: 1 }] }, { duration: 0.25, notes: [{ string: 4, fret: 2 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 3 }] }, { duration: 0.25, notes: [{ string: 5, fret: 3 }] }, { duration: 0.25, notes: [{ string: 4, fret: 2 }] }, { duration: 0.25, notes: [{ string: 3, fret: 1 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 4 }] }, { duration: 0.25, notes: [{ string: 4, fret: 5 }] }, { duration: 0.25, notes: [{ string: 3, fret: 6 }] }, { duration: 0.25, notes: [{ string: 5, fret: 6 }] },
      ]
    }
  ],
  relatedSkills: ["alternate_picking", "picking", "finger_independence", "technique"],
  image: spiderBasicImage,
};