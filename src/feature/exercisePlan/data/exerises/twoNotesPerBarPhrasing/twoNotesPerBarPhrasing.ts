import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const twoNotesPerBarPhrasingExercise: Exercise = {
  id: "two_notes_per_bar_phrasing",
  title: "Two-Notes-Per-Bar Phrasing",
  description:
    "Exercise developing phrasing, space, and musical decision-making by strictly limiting you to a maximum of two notes per bar.",
  difficulty: "easy",
  category: "creativity",
  timeInMinutes: 10,
  instructions: [
    "Choose a looping chord progression or any backing track with clear bar structure (4/4 time).",
    "Use a metronome or backing track so the bar length is clearly defined; keep the tempo moderate.",
    "You may play a maximum of two notes per bar. One note or silence is allowed, but never a third note.",
    "Decide freely where to place your one or two notes within the bar (downbeats, offbeats, close together, or far apart).",
    "Once two notes are played in a bar, remain silent until the next bar begins.",
    "Choose notes that fit the current chord; with so few notes, chord tones or tasteful extensions work best.",
    "Apply the same rule consistently as the chords change, planning each bar intentionally.",
    "If the tempo is very fast, allow two notes every two bars instead, keeping the same sense of space."
  ],
  tips: [
    "Count bars actively to avoid accidentally playing extra notes.",
    "Treat silence as part of the phrase — the rests are as important as the notes.",
    "Vary rhythmic placement from bar to bar to avoid mechanical phrasing.",
    "Focus on tone, sustain, vibrato, and dynamics since each note is exposed.",
    "If you catch yourself playing habitual licks, slow down and reset the exercise."
  ],
  metronomeSpeed: null,
  relatedSkills: ["phrasing", "improvisation"],
};
