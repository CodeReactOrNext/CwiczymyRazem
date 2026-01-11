import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const vibratoMasteryExercise: Exercise = {
  id: "vibrato_mastery",
  title: "Vibrato Mastery",
  description: "Exercise focusing on control of width and speed of your vibrato for maximum expression.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Choose a single note in a comfortable position (e.g. 7th fret on G string).",
    "Apply vibrato with a steady, wide movement for 4 beats.",
    "Gradually increase the speed of the vibrato while narrowing its width.",
    "Return to a slow, wide vibrato.",
    "Try to match the vibrato speed to a metronome (e.g. 1 1/4 note cycle).",
    "Repeat on different fingers (index, middle, ring, pinky)."
  ],
  tips: [
    "Use your wrist for movement, not just fingers.",
    "Listen for pitch consistency — don't let it go too sharp or flat.",
    "Keep your thumb stable on the neck for leverage."
  ],
  metronomeSpeed: {
    min: 40,
    max: 80,
    recommended: 60,
  },
  relatedSkills: ["vibrato", "articulation", "phrasing"],
};
