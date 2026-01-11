import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const fretboardMasteryExercise: Exercise = {
  id: "fretboard_mastery",
  title: "Fretboard Mastery",
  description:
    "Exercise developing full fretboard awareness by playing the same melodic phrase in multiple positions, forcing note-based thinking instead of relying on shapes.",
  difficulty: "hard",
  category: "theory",
  timeInMinutes: 8,
  instructions: [
    "Choose a short melodic phrase or riff (3–5 notes) that you know well by ear and can clearly name by note (e.g. C–D–E–G).",
    "Play the phrase in one familiar position, making sure you know the exact note names.",
    "Find another position on the fretboard where the same notes can be played and repeat the phrase there.",
    "Continue moving the phrase systematically across the fretboard, shifting to higher positions or different strings.",
    "Do not change note order or intervals — the melody must remain identical, only its position changes.",
    "Avoid tabs or fretboard diagrams; rely on note names and your ear.",
    "Try playing the phrase on single strings when possible to force non-standard positions.",
    "Switch randomly between low, middle, and high positions while keeping steady timing.",
    "Start the phrase from different notes of the melody when possible (e.g. begin on G instead of C)."
  ],
  tips: [
    "If you hesitate mid-phrase, slow down but do not stop completely.",
    "Think in note names, not fret numbers or finger patterns.",
    "If a position does not fit the full phrase, adjust octave placement instead of changing the melody.",
    "Try short moments without looking at the fretboard to test your mental map.",
    "Consistency matters more than speed — accuracy builds real fretboard knowledge."
  ],
  metronomeSpeed: null,
  relatedSkills: [
    "music_theory",
    "ear_training",
    "improvisation"
  ],
};
