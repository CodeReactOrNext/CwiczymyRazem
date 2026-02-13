import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const metronomeGapTestExercise: Exercise = {
  id: "metronome_gap_test",
  title: "Metronome Gap Test",
  description: "Advanced timing exercise: maintain a steady pulse when the metronome stops/silences.",
  difficulty: "medium",
  category: "theory",
  timeInMinutes: 5,
  instructions: [
    "Choose a simple rhythm (e.g. constant eighth notes).",
    "Set a metronome that has a 'silence' or 'gap' feature (or count mentally).",
    "Play for 2 bars with the metronome on.",
    "The metronome goes silent for 2 bars — keep playing at the exact same tempo.",
    "Verify your accuracy when the metronome returns on the first beat of the next bar.",
    "Increase the gap length (e.g. 4 bars silent) as you improve."
  ],
  tips: [
    "Internalize the pulse by subdividing (count 1 & 2 & 3 & 4 &).",
    "Don't look at the metronome visual cues during the gap.",
    "If you are off, determine if you are rushing or dragging."
  ],
  metronomeSpeed: {
    min: 40,
    max: 120,
    recommended: 80,
  },
  relatedSkills: ["rhythm"],
};
