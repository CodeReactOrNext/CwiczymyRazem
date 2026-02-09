import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const triadImprovisationExercise: Exercise = {
  id: "triad_improvisation",
  title: "Triad Improvisation",
  description: "Exercise developing improvisation skills using chord triads, strengthening harmonic awareness and melodic fluency.",
  difficulty: "hard",
  category: "creativity",
  timeInMinutes: 12,
  instructions: [
    "Choose a backing track with a clear chord progression (e.g., blues, jazz standard, pop song).",
    "Identify the chord sequence in the backing track and list their corresponding triads.",
    "While playing, use only notes from the triad of the currently sounding chord (root, third, fifth).",
    "Change triads as the chords change in the backing track, building melodies from these three notes.",
    "Experiment with different triad inversions to achieve smoother melodic transitions."
  ],
  tips: [
    "Know the shapes of triads in all inversions on different string sets.",
    "Less is more - instead of playing many notes, focus on melodiousness and rhythmic variety.",
    "Try connecting triads from the closest positions - look for common tones between chords.",
    "Use arpeggios (broken chords) and vertical triads in various combinations.",
    "Pay attention to the tonal character of each triad - major, minor, diminished or augmented."
  ],
  metronomeSpeed: null,
  relatedSkills: ["harmony", "improvisation", "chord_theory", ],
}; 