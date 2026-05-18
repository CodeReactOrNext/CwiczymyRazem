import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";


export const spiderLegatoBasicExercise: Exercise = {
  id: "spider_legato_basic",
  title: "Spider Legato - Basic",
  description: "Execute the spider walk pattern purely with hammer-ons and pull-offs.",
  whyItMatters: "Removing the pick forces your fretting hand to do all the work. This builds massive strength, finger independence, and timing control, leading to incredibly fluid legato runs.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Strike only the first note of each string, executing the rest with pure legato.",
    "Ensure hammer-ons are strong and pull-offs are clean and snapped."
  ],
  tips: [
    "Keep unused fingers hovered close to the strings to prevent sympathetic ring.",
    "Flick the string slightly downward during pull-offs to maintain volume."
  ],
  metronomeSpeed: {
    min: 40,
    max: 120,
    recommended: 60,
  },
  relatedSkills: ["legato"],
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