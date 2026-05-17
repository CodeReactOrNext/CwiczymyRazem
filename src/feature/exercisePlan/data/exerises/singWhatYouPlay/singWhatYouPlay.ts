import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const singWhatYouPlayExercise: Exercise = {
  id: "sing_what_you_play",
  title: "Sing What You Play",
  description: "Sing pitches out loud simultaneously as you play them on the guitar.",
  whyItMatters: "This exercise bridges the gap between your physical muscle memory and your internal ear. By forcing your vocal cords to match the notes your fingers are playing, you eliminate the delay between musical thought and execution, ensuring you play what you hear rather than just running visual patterns on the fretboard.",
  difficulty: "hard",
  category: "hearing",
  timeInMinutes: 10,
  instructions: [
    "Select a scale or a single string to limit the initial complexity.",
    "Play a short 3- to 4-note melodic phrase on the guitar.",
    "Sing the exact pitches out loud while playing them, using syllables like 'la', 'da', or the note names.",
    "Reverse the process: sing a short, spontaneous melody first, then immediately locate and play those notes on the guitar.",
  ],
  tips: [
    "Vocal tone quality is entirely irrelevant; focus solely on accurate pitch matching.",
    "Begin with small, conjunct intervals (moving stepwise up or down the scale) before attempting large jumps.",
    "Use a clean, undistorted guitar tone so you can clearly hear the fundamental pitch of the notes.",
  ],
  metronomeSpeed: null,
  relatedSkills: ["ear_training", "phrasing", "improvisation"],
};
