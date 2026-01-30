import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";


export const spiderLegatoBasicExercise: Exercise = {
  id: "spider_legato_basic",
  title: "Spider Legato - Basic",
  description: "Exercise developing left hand strength and legato technique (hammer-ons and pull-offs).",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Perform the spider exercise using only legato technique.",
    "Ascending: Play 1-2-3-4 with hammer-ons across strings 6 to 1 at the same position. Shift up one fret only when moving back up the strings.",
    "Descending: After reaching the top, play 8-7-6-5 with pull-offs across strings 6 to 1 at the same position. Shift down one fret only when moving back up the strings.",
  ],
  tips: [
    "Ensure each hammer-on and pull-off is clear and has consistent volume.",
    "Keep your fingers close to the fretboard to minimize movement.",
    "Maintain a steady rhythm.",
  ],
  metronomeSpeed: {
    min: 40,
    max: 120,
    recommended: 60,
  },
  relatedSkills: ["finger_independence", "picking"],
  tablature: [
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 1 }] }, { duration: 0.25, notes: [{ string: 6, fret: 2, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 3, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 4, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 1 }] }, { duration: 0.25, notes: [{ string: 5, fret: 2, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 3, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 4, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 1 }] }, { duration: 0.25, notes: [{ string: 4, fret: 2, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 3, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 4, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 1 }] }, { duration: 0.25, notes: [{ string: 3, fret: 2, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 3, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 4, isHammerOn: true }] },
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 2, fret: 1 }] }, { duration: 0.25, notes: [{ string: 2, fret: 2, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 3, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 4, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 1 }] }, { duration: 0.25, notes: [{ string: 1, fret: 2, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 3, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 4, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 2 }] }, { duration: 0.25, notes: [{ string: 1, fret: 3, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 4, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 5, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 2 }] }, { duration: 0.25, notes: [{ string: 2, fret: 3, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 4, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 5, isHammerOn: true }] },
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 3, fret: 2 }] }, { duration: 0.25, notes: [{ string: 3, fret: 3, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 4, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 5, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 2 }] }, { duration: 0.25, notes: [{ string: 4, fret: 3, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 4, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 5, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 2 }] }, { duration: 0.25, notes: [{ string: 5, fret: 3, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 4, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 5, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 2 }] }, { duration: 0.25, notes: [{ string: 6, fret: 3, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 4, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 5, isHammerOn: true }] },
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 3 }] }, { duration: 0.25, notes: [{ string: 6, fret: 4, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 5, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 6, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 3 }] }, { duration: 0.25, notes: [{ string: 5, fret: 4, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 5, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 6, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 3 }] }, { duration: 0.25, notes: [{ string: 4, fret: 4, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 5, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 6, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 3 }] }, { duration: 0.25, notes: [{ string: 3, fret: 4, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 5, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 6, isHammerOn: true }] },
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 2, fret: 3 }] }, { duration: 0.25, notes: [{ string: 2, fret: 4, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 5, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 6, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 3 }] }, { duration: 0.25, notes: [{ string: 1, fret: 4, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 5, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 6, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 6 }] }, { duration: 0.25, notes: [{ string: 1, fret: 5, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 4, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 3, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 6 }] }, { duration: 0.25, notes: [{ string: 2, fret: 5, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 4, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 3, isPullOff: true }] },
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 3, fret: 6 }] }, { duration: 0.25, notes: [{ string: 3, fret: 5, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 4, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 3, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 6 }] }, { duration: 0.25, notes: [{ string: 4, fret: 5, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 4, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 3, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 6 }] }, { duration: 0.25, notes: [{ string: 5, fret: 5, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 4, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 3, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 6 }] }, { duration: 0.25, notes: [{ string: 6, fret: 5, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 4, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 3, isPullOff: true }] },
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 5 }] }, { duration: 0.25, notes: [{ string: 6, fret: 4, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 3, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 2, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] }, { duration: 0.25, notes: [{ string: 5, fret: 4, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 3, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 2, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] }, { duration: 0.25, notes: [{ string: 4, fret: 4, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 3, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 2, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] }, { duration: 0.25, notes: [{ string: 3, fret: 4, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 3, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 2, isPullOff: true }] },
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] }, { duration: 0.25, notes: [{ string: 2, fret: 4, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 3, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 2, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5 }] }, { duration: 0.25, notes: [{ string: 1, fret: 4, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 3, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 2, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 4 }] }, { duration: 0.25, notes: [{ string: 1, fret: 3, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 2, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 1, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 4 }] }, { duration: 0.25, notes: [{ string: 2, fret: 3, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 2, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 1, isPullOff: true }] },
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 3, fret: 4 }] }, { duration: 0.25, notes: [{ string: 3, fret: 3, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 2, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 1, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 4 }] }, { duration: 0.25, notes: [{ string: 4, fret: 3, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 2, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 1, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 4 }] }, { duration: 0.25, notes: [{ string: 5, fret: 3, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 2, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 1, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 4 }] }, { duration: 0.25, notes: [{ string: 6, fret: 3, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 2, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 1, isPullOff: true }] },
      ]
    }
  ],
  image: spiderBasicImage,
};