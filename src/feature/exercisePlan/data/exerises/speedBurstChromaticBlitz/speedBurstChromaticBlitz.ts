import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const speedBurstChromaticBlitzExercise: Exercise = {
  id: "speed_burst_chromatic_blitz",
  title: "Speed Burst Chromatic Blitz",
  description: "Execute brief, rapid chromatic note groups interspersed with quick rests to build fast twitch muscle response and control hand tension.",
  whyItMatters: "This exercise develops fast-twitch muscle response in both hands. It trains your fingers to fire quickly in sync, and teaches you how to release tension instantly during rests, preventing hand fatigue.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Play the short note groups rapidly and cleanly, treating them as a single rhythmic gesture.",
    "Use the silence of each rest to completely relax both hands.",
    "Maintain strict alternate picking (down-up-down-up) during each sprint.",
  ],
  tips: [
    "Do not try to force high speeds — focus on the quick release of hand tension during the rests.",
    "Keep your finger movements tiny and pick strokes shallow to conserve energy.",
    "Slow down the overall tempo if the transition between strings feels uneven.",
  ],
  metronomeSpeed: {
    min: 100,
    max: 160,
    recommended: 120,
  },
  relatedSkills: ["alternate_picking"],
  tablature: [
    // M1: 4-note bursts ascending — string 6, rest, string 5, rest
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 6 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 8 }] },
        { duration: 1, notes: [] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 6 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 8 }] },
        { duration: 1, notes: [] },
      ],
    },
    // M2: 4-note bursts continuing ascending — string 4, rest, string 3, rest
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 6 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 8 }] },
        { duration: 1, notes: [] },
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 6 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 8 }] },
        { duration: 1, notes: [] },
      ],
    },
    // M3: 4-note bursts descending — reverse back down
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 3, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 6 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] },
        { duration: 1, notes: [] },
        { duration: 0.25, notes: [{ string: 4, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 6 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] },
        { duration: 1, notes: [] },
      ],
    },
    // M4: 6-note cross-string bursts (3nps) — strings 6+5, rest, strings 4+3, rest
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 6 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 6 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 7 }] },
        { duration: 0.5, notes: [] },
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 6 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 6 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.5, notes: [] },
      ],
    },
    // M5: 6-note cross-string bursts — shifted to position 7
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 9 }] },
        { duration: 0.5, notes: [] },
        { duration: 0.25, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.5, notes: [] },
      ],
    },
  ],
};
