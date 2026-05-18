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
    "Execute notes cleanly while suppressing all sympathetic string vibrations.",
    "Audit your dynamic consistency and attack angle using a clean tone.",
    "Transition between positions fluidly without disrupting the rhythmic grid."
  ],
  tips: [
    "Mute low strings with your picking-hand palm and high strings with your fretting-hand index finger.",
    "Ensure notes do not bleed together during chord transitions unless explicitly sustained.",
    "Maintain an upright, relaxed posture to prevent muscle fatigue."
  ],
  metronomeSpeed: {
    min: 40,
    max: 120,
    recommended: 80,
  },
  relatedSkills: ["rhythm"],
};
