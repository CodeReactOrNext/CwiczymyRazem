import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const oneStringBackingExercise: Exercise = {
  id: "one_string_backing",
  title: "Single String Phrasing",
  description: "Improvise over a backing track while physically restricting your playing to a single string.",
  whyItMatters: "Removing the ability to play across strings eliminates reliance on familiar vertical box shapes. This forces you to navigate the fretboard horizontally, significantly improving your ability to connect distant positions and demanding a heavy reliance on expressive techniques (slides, bends) to keep the phrasing interesting.",
  requiresBackingTrack: true,
  difficulty: "medium",
  category: "creativity",
  timeInMinutes: 10,
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
  metronomeSpeed: null,
  relatedSkills: ["phrasing", "improvisation"],
}; 