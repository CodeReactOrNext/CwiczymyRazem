import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";


export const spiderBasicExercise: Exercise = {
  id: "spider_basic",
  title: "Horizontal Spider Exercise",
  description: "Exercise developing left hand precision and synchronization with right hand.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 4,
  instructions: [
    "Perform the 'spider' exercise on the guitar, playing 4 notes per beat (i.e. sixteenths). Maintain the pattern shown on the tablature, shifting it every fret after completing a repetition.",

  ],
  tips: [
    "Focus on even pressure and smooth movements.",
    "Try not to lift fingers unnecessarily to maintain stability and economy of movement.",
    "Practice intonation, ensuring each note sounds clean and clear.",
    "Control hand tension, don't squeeze the neck too hard but maintain stability.",
    "Adjust tempo to your abilities, gradually increasing it.",
    "You can freely change position on the fretboard to practice different hand arrangements.",
  ],
  metronomeSpeed: {
    min: 40,
    max: 180,
    recommended: 80,
  },
  relatedSkills: ["alternate_picking", "finger_independence"],
  tablature: [
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 1 }] }, { duration: 0.25, notes: [{ string: 6, fret: 2 }] }, { duration: 0.25, notes: [{ string: 6, fret: 3 }] }, { duration: 0.25, notes: [{ string: 6, fret: 4 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 2 }] }, { duration: 0.25, notes: [{ string: 5, fret: 3 }] }, { duration: 0.25, notes: [{ string: 5, fret: 4 }] }, { duration: 0.25, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 3 }] }, { duration: 0.25, notes: [{ string: 4, fret: 4 }] }, { duration: 0.25, notes: [{ string: 4, fret: 5 }] }, { duration: 0.25, notes: [{ string: 4, fret: 6 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 4 }] }, { duration: 0.25, notes: [{ string: 3, fret: 5 }] }, { duration: 0.25, notes: [{ string: 3, fret: 6 }] }, { duration: 0.25, notes: [{ string: 3, fret: 7 }] },
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] }, { duration: 0.25, notes: [{ string: 2, fret: 6 }] }, { duration: 0.25, notes: [{ string: 2, fret: 7 }] }, { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] }, { duration: 0.25, notes: [{ string: 1, fret: 7 }] }, { duration: 0.25, notes: [{ string: 1, fret: 6 }] }, { duration: 0.25, notes: [{ string: 1, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 7 }] }, { duration: 0.25, notes: [{ string: 2, fret: 6 }] }, { duration: 0.25, notes: [{ string: 2, fret: 5 }] }, { duration: 0.25, notes: [{ string: 2, fret: 4 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 6 }] }, { duration: 0.25, notes: [{ string: 3, fret: 5 }] }, { duration: 0.25, notes: [{ string: 3, fret: 4 }] }, { duration: 0.25, notes: [{ string: 3, fret: 3 }] },
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] }, { duration: 0.25, notes: [{ string: 4, fret: 4 }] }, { duration: 0.25, notes: [{ string: 4, fret: 3 }] }, { duration: 0.25, notes: [{ string: 4, fret: 2 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 4 }] }, { duration: 0.25, notes: [{ string: 5, fret: 3 }] }, { duration: 0.25, notes: [{ string: 5, fret: 2 }] }, { duration: 0.25, notes: [{ string: 5, fret: 1 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 2 }] }, { duration: 0.25, notes: [{ string: 6, fret: 3 }] }, { duration: 0.25, notes: [{ string: 6, fret: 4 }] }, { duration: 0.25, notes: [{ string: 6, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 3 }] }, { duration: 0.25, notes: [{ string: 5, fret: 4 }] }, { duration: 0.25, notes: [{ string: 5, fret: 5 }] }, { duration: 0.25, notes: [{ string: 5, fret: 6 }] },
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 4, fret: 4 }] }, { duration: 0.25, notes: [{ string: 4, fret: 5 }] }, { duration: 0.25, notes: [{ string: 4, fret: 6 }] }, { duration: 0.25, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] }, { duration: 0.25, notes: [{ string: 3, fret: 6 }] }, { duration: 0.25, notes: [{ string: 3, fret: 7 }] }, { duration: 0.25, notes: [{ string: 3, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 6 }] }, { duration: 0.25, notes: [{ string: 2, fret: 7 }] }, { duration: 0.25, notes: [{ string: 2, fret: 8 }] }, { duration: 0.25, notes: [{ string: 2, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 9 }] }, { duration: 0.25, notes: [{ string: 1, fret: 8 }] }, { duration: 0.25, notes: [{ string: 1, fret: 7 }] }, { duration: 0.25, notes: [{ string: 1, fret: 6 }] },
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] }, { duration: 0.25, notes: [{ string: 2, fret: 7 }] }, { duration: 0.25, notes: [{ string: 2, fret: 6 }] }, { duration: 0.25, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7 }] }, { duration: 0.25, notes: [{ string: 3, fret: 6 }] }, { duration: 0.25, notes: [{ string: 3, fret: 5 }] }, { duration: 0.25, notes: [{ string: 3, fret: 4 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 6 }] }, { duration: 0.25, notes: [{ string: 4, fret: 5 }] }, { duration: 0.25, notes: [{ string: 4, fret: 4 }] }, { duration: 0.25, notes: [{ string: 4, fret: 3 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] }, { duration: 0.25, notes: [{ string: 5, fret: 4 }] }, { duration: 0.25, notes: [{ string: 5, fret: 3 }] }, { duration: 0.25, notes: [{ string: 5, fret: 2 }] },
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 3 }] }, { duration: 0.25, notes: [{ string: 6, fret: 4 }] }, { duration: 0.25, notes: [{ string: 6, fret: 5 }] }, { duration: 0.25, notes: [{ string: 6, fret: 6 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 4 }] }, { duration: 0.25, notes: [{ string: 5, fret: 5 }] }, { duration: 0.25, notes: [{ string: 5, fret: 6 }] }, { duration: 0.25, notes: [{ string: 5, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] }, { duration: 0.25, notes: [{ string: 4, fret: 6 }] }, { duration: 0.25, notes: [{ string: 4, fret: 7 }] }, { duration: 0.25, notes: [{ string: 4, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 6 }] }, { duration: 0.25, notes: [{ string: 3, fret: 7 }] }, { duration: 0.25, notes: [{ string: 3, fret: 8 }] }, { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 2, fret: 7 }] }, { duration: 0.25, notes: [{ string: 2, fret: 8 }] }, { duration: 0.25, notes: [{ string: 2, fret: 9 }] }, { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 10 }] }, { duration: 0.25, notes: [{ string: 1, fret: 9 }] }, { duration: 0.25, notes: [{ string: 1, fret: 8 }] }, { duration: 0.25, notes: [{ string: 1, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 9 }] }, { duration: 0.25, notes: [{ string: 2, fret: 8 }] }, { duration: 0.25, notes: [{ string: 2, fret: 7 }] }, { duration: 0.25, notes: [{ string: 2, fret: 6 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 8 }] }, { duration: 0.25, notes: [{ string: 3, fret: 7 }] }, { duration: 0.25, notes: [{ string: 3, fret: 6 }] }, { duration: 0.25, notes: [{ string: 3, fret: 5 }] },
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 4, fret: 7 }] }, { duration: 0.25, notes: [{ string: 4, fret: 6 }] }, { duration: 0.25, notes: [{ string: 4, fret: 5 }] }, { duration: 0.25, notes: [{ string: 4, fret: 4 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 6 }] }, { duration: 0.25, notes: [{ string: 5, fret: 5 }] }, { duration: 0.25, notes: [{ string: 5, fret: 4 }] }, { duration: 0.25, notes: [{ string: 5, fret: 3 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 4 }] }, { duration: 0.25, notes: [{ string: 6, fret: 5 }] }, { duration: 0.25, notes: [{ string: 6, fret: 6 }] }, { duration: 0.25, notes: [{ string: 6, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] }, { duration: 0.25, notes: [{ string: 5, fret: 6 }] }, { duration: 0.25, notes: [{ string: 5, fret: 7 }] }, { duration: 0.25, notes: [{ string: 5, fret: 8 }] },
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 4, fret: 6 }] }, { duration: 0.25, notes: [{ string: 4, fret: 7 }] }, { duration: 0.25, notes: [{ string: 4, fret: 8 }] }, { duration: 0.25, notes: [{ string: 4, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7 }] }, { duration: 0.25, notes: [{ string: 3, fret: 8 }] }, { duration: 0.25, notes: [{ string: 3, fret: 9 }] }, { duration: 0.25, notes: [{ string: 3, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] }, { duration: 0.25, notes: [{ string: 2, fret: 9 }] }, { duration: 0.25, notes: [{ string: 2, fret: 10 }] }, { duration: 0.25, notes: [{ string: 2, fret: 11 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 11 }] }, { duration: 0.25, notes: [{ string: 1, fret: 10 }] }, { duration: 0.25, notes: [{ string: 1, fret: 9 }] }, { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] }, { duration: 0.25, notes: [{ string: 2, fret: 9 }] }, { duration: 0.25, notes: [{ string: 2, fret: 8 }] }, { duration: 0.25, notes: [{ string: 2, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] }, { duration: 0.25, notes: [{ string: 3, fret: 8 }] }, { duration: 0.25, notes: [{ string: 3, fret: 7 }] }, { duration: 0.25, notes: [{ string: 3, fret: 6 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 8 }] }, { duration: 0.25, notes: [{ string: 4, fret: 7 }] }, { duration: 0.25, notes: [{ string: 4, fret: 6 }] }, { duration: 0.25, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 7 }] }, { duration: 0.25, notes: [{ string: 5, fret: 6 }] }, { duration: 0.25, notes: [{ string: 5, fret: 5 }] }, { duration: 0.25, notes: [{ string: 5, fret: 4 }] },
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 5 }] }, { duration: 0.25, notes: [{ string: 6, fret: 6 }] }, { duration: 0.25, notes: [{ string: 6, fret: 7 }] }, { duration: 0.25, notes: [{ string: 6, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 6 }] }, { duration: 0.25, notes: [{ string: 5, fret: 7 }] }, { duration: 0.25, notes: [{ string: 5, fret: 8 }] }, { duration: 0.25, notes: [{ string: 5, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 7 }] }, { duration: 0.25, notes: [{ string: 4, fret: 8 }] }, { duration: 0.25, notes: [{ string: 4, fret: 9 }] }, { duration: 0.25, notes: [{ string: 4, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 8 }] }, { duration: 0.25, notes: [{ string: 3, fret: 9 }] }, { duration: 0.25, notes: [{ string: 3, fret: 10 }] }, { duration: 0.25, notes: [{ string: 3, fret: 11 }] },
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 2, fret: 9 }] }, { duration: 0.25, notes: [{ string: 2, fret: 10 }] }, { duration: 0.25, notes: [{ string: 2, fret: 11 }] }, { duration: 0.25, notes: [{ string: 2, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12 }] }, { duration: 0.25, notes: [{ string: 1, fret: 11 }] }, { duration: 0.25, notes: [{ string: 1, fret: 10 }] }, { duration: 0.25, notes: [{ string: 1, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 11 }] }, { duration: 0.25, notes: [{ string: 2, fret: 10 }] }, { duration: 0.25, notes: [{ string: 2, fret: 9 }] }, { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 10 }] }, { duration: 0.25, notes: [{ string: 3, fret: 9 }] }, { duration: 0.25, notes: [{ string: 3, fret: 8 }] }, { duration: 0.25, notes: [{ string: 3, fret: 7 }] },
      ]
    },
    {
      timeSignature: [2, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 4, fret: 9 }] }, { duration: 0.25, notes: [{ string: 4, fret: 8 }] }, { duration: 0.25, notes: [{ string: 4, fret: 7 }] }, { duration: 0.25, notes: [{ string: 4, fret: 6 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 8 }] }, { duration: 0.25, notes: [{ string: 5, fret: 7 }] }, { duration: 0.25, notes: [{ string: 5, fret: 6 }] }, { duration: 0.25, notes: [{ string: 5, fret: 5 }] },
      ]
    }
  ],

  image: spiderBasicImage,
};