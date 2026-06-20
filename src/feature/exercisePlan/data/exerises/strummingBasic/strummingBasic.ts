import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const strummingBasicExercise: Exercise = {
  id: "strumming_basic",
  title: "Basic Down Strumming",
  description: "Strum steady downward strokes on every beat over an Em chord to build basic rhythm and timing.",
  whyItMatters: "This is the basic up-and-down arm movement used in all rhythm playing. Strumming steady downbeats locks your timing to the metronome, keeps your wrist relaxed, and helps you hit all the strings of the chord evenly.",
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Hold an Em chord (the easiest open chord) and let it ring through the whole exercise.",
    "Strum only downward, one stroke on each beat, with a relaxed swing of the wrist and forearm.",
    "Keep your strumming arm swinging gently even on the empty beats, so the rhythm stays steady."
  ],
  tips: [
    "Angle the pick slightly so it glides across the strings instead of catching.",
    "Keep the pick shallow — just skim the strings rather than digging in.",
    "Count out loud (1-2-3-4) with the metronome to stay locked to the beat."
  ],
  metronomeSpeed: { min: 50, max: 120, recommended: 70 },
  relatedSkills: ["rhythm"],
  strummingPatterns: [
    {
      name: "Pattern: All Downs (Em)",
      chord: "Em",
      timeSignature: [4, 4],
      subdivisions: 2,
      strums: [
        { direction: "down" },
        { direction: "miss" },
        { direction: "down" },
        { direction: "miss" },
        { direction: "down" },
        { direction: "miss" },
        { direction: "down" },
        { direction: "miss" },
      ],
    },
  ],
};
