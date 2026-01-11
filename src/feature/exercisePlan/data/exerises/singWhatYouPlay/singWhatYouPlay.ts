import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const singWhatYouPlayExercise: Exercise = {
  id: "sing_what_you_play",
  title: "Sing What You Play",
  description: "Advanced ear-training and phrasing drill: connect your voice to your fingers.",
  difficulty: "hard",
  category: "hearing",
  timeInMinutes: 10,
  instructions: [
    "Choose a simple scale or key.",
    "Play a short 3-note phrase on the guitar.",
    "Sing the exact same phrase using 'la', 'da', or note names.",
    "Try the reverse: sing a random short phrase first, then try to find it on the guitar immediately.",
    "The goal is to eliminate the 'delay' between musical thought and execution."
  ],
  tips: [
    "Don't worry about being a 'good' singer; focus on pitch accuracy.",
    "Start with very small intervals (seconds and thirds).",
    "Use a clean tone on the guitar to hear the pitches clearly."
  ],
  metronomeSpeed: null,
  relatedSkills: ["ear_training", "phrasing", "improvisation"],
};
