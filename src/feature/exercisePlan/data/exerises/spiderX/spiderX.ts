import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";


export const spiderXExercise: Exercise = {
  id: "spider_x",
  title: "Spider X Pattern Exercise",
  description: "Exercise using X-pattern to develop finger independence and hand coordination.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 8,
  instructions: [
    "Position fingers in an X shape on two adjacent strings.",
    "Play alternating notes from both strings, maintaining the X pattern.",
    "Move the pattern one fret higher after each cycle.",
    "Repeat the exercise on all adjacent string pairs."
  ],
  tips: [
    "Pay attention to note clarity when crossing fingers.",
    "Maintain minimal hand tension despite unusual pattern.",
    "Practice slowly, focusing on movement accuracy.",
    "Experiment with different rhythms within the pattern."
  ],
  metronomeSpeed: {
    min: 60,
    max: 140,
    recommended: 80,
  },
  tablature: [
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 1 }] }, { duration: 0.25, notes: [{ string: 5, fret: 2 }] }, { duration: 0.25, notes: [{ string: 4, fret: 3 }] }, { duration: 0.25, notes: [{ string: 3, fret: 4 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 1 }] }, { duration: 0.25, notes: [{ string: 4, fret: 2 }] }, { duration: 0.25, notes: [{ string: 5, fret: 3 }] }, { duration: 0.25, notes: [{ string: 6, fret: 4 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 2 }] }, { duration: 0.25, notes: [{ string: 5, fret: 3 }] }, { duration: 0.25, notes: [{ string: 4, fret: 4 }] }, { duration: 0.25, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 2 }] }, { duration: 0.25, notes: [{ string: 4, fret: 3 }] }, { duration: 0.25, notes: [{ string: 5, fret: 4 }] }, { duration: 0.25, notes: [{ string: 6, fret: 5 }] },
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 3 }] }, { duration: 0.25, notes: [{ string: 5, fret: 4 }] }, { duration: 0.25, notes: [{ string: 4, fret: 5 }] }, { duration: 0.25, notes: [{ string: 3, fret: 6 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 3 }] }, { duration: 0.25, notes: [{ string: 3, fret: 4 }] }, { duration: 0.25, notes: [{ string: 5, fret: 5 }] }, { duration: 0.25, notes: [{ string: 6, fret: 6 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 4 }] }, { duration: 0.25, notes: [{ string: 5, fret: 5 }] }, { duration: 0.25, notes: [{ string: 4, fret: 6 }] }, { duration: 0.25, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 4 }] }, { duration: 0.25, notes: [{ string: 4, fret: 5 }] }, { duration: 0.25, notes: [{ string: 5, fret: 6 }] }, { duration: 0.25, notes: [{ string: 6, fret: 7 }] },
      ]
    }
  ],
  relatedSkills: ["alternate_picking", "picking", "finger_independence"],
  image: spiderBasicImage,
};