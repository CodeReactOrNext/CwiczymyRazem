import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";


export const spiderBasicExercise: Exercise = {
  id: "spider_basic",
  title: "Horizontal Spider Exercise",
  description: "Master left-hand finger independence and sync it perfectly with your picking hand using this foundational horizontal shifting pattern.",
  whyItMatters: "This exercise develops solid finger autonomy. It prevents fingers from 'flying away' from the fretboard, vastly improves economy of motion, and synchronizes both hands for clean, fast lead playing.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 4,
  instructions: [
    "Play 4 even notes per beat using strict alternate picking (down-up-down-up).",
    "Shift your entire hand up by one fret each time you complete a full pattern cycle.",
    "Ensure every note sounds completely clear before moving to the next fret.",
  ],
  tips: [
    "Keep unused fingers hovering extremely close to the strings to minimize movement.",
    "Relax your grip — use minimum pressure required to fret each note cleanly.",
    "Use a metronome and slow down if your timing between hand shifts becomes uneven.",
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