import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const metronomeGapTestExercise: Exercise = {
  id: "metronome_gap_test",
  title: "Metronome Gap Test",
  description: "Maintain a steady rhythmic pulse while the metronome is muted for several measures.",
  whyItMatters: "This exercise exposes whether you are genuinely internalizing the tempo or just blindly following an external click. By forcing you to maintain the grid during silence, it develops the deep internal timing required to lead a band, lock in with a drummer, and prevent rushing or dragging.",
  difficulty: "medium",
  category: "theory",
  timeInMinutes: 5,
  instructions: [
    "Lock in with the metronome for the first few bars until the tempo feels steady.",
    "When the click goes silent, keep playing in exactly the same tempo — don't speed up or slow down.",
    "When the metronome comes back, check whether you're still in time with it."
  ],
  tips: [
    "Count out loud or tap your foot during the silent bars to hold the pulse.",
    "Rushing usually means you're tense — relax your hands and breathe steadily.",
    "If you drift off, start the metronome again and shorten the silent gap until it feels easy."
  ],
  metronomeSpeed: {
    min: 40,
    max: 120,
    recommended: 80,
  },
  relatedSkills: ["rhythm"],
};
