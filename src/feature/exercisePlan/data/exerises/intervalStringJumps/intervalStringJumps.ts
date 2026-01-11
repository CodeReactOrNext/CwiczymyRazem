import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const intervalStringJumpsExercise: Exercise = {
  id: "interval_string_jumps",
  title: "Interval String Jumps",
  description: "Fretboard awareness exercise skipping strings to build knowledge of intervals like 6ths and 10ths.",
  difficulty: "hard",
  category: "theory",
  timeInMinutes: 7,
  instructions: [
    "Choose a specific interval (e.g. Major 6th).",
    "Find a root note on the Low E string.",
    "Play the 6th on the D string (skipping the A string).",
    "Systematically move this interval shape up and down the neck.",
    "Repeat the process for other string sets (e.g. A string to G string).",
    "Switch to other intervals like 10ths (E string to G string)."
  ],
  tips: [
    "Visualize the interval shape relative to the root.",
    "Say the note names as you play both notes.",
    "Mute the skipped string reliably."
  ],
  metronomeSpeed: null,
  relatedSkills: ["chord_theory", "music_theory", "harmony"],
};
