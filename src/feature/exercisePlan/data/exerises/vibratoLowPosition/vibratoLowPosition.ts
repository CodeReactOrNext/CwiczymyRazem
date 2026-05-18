import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const vibratoLowPositionExercise: Exercise = {
  id: "vibrato_low_position",
  title: "Vibrato — Low Position (Frets 1–5)",
  description:
    "Develop controlled, wide vibrato in the lower frets with high string tension.",
  whyItMatters: "Fretting near the nut requires more physical force to modulate the string's pitch. This drill builds the foundational hand strength and wrist mechanics needed to execute clean, wide vibrato on low frets.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  instructions: [
    "Apply firm finger and wrist force to overcome the high string tension near the nut.",
    "Rotate your wrist wide, keeping the oscillation rhythmically even."
  ],
  tips: [
    "Anchor your thumb securely behind the neck to leverage the wider wrist rotation.",
    "Focus on keeping the oscillation width equal above and below the target pitch."
  ],
  metronomeSpeed: { min: 40, max: 80, recommended: 55 },
  relatedSkills: ["vibrato", "articulation"],
  tablature: [
    // M1: E — str1, fret 5 — high e string, thin and responsive
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 1, fret: 5, isVibrato: true }] },
      ],
    },
    // M2: C — str2, fret 1 — first fret, maximum tension challenge
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 2, fret: 1, isVibrato: true }] },
      ],
    },
    // M3: G — str3, fret 5 — heavier string, more force needed
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 3, fret: 5, isVibrato: true }] },
      ],
    },
    // M4: D — str4, fret 5 — heaviest string in set, full wrist commitment
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 4, fret: 5, isVibrato: true }] },
      ],
    },
  ],
};
