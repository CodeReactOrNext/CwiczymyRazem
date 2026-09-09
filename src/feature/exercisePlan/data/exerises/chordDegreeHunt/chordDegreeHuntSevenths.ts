import { createChordDegreeHuntExercise } from "./createChordDegreeHuntExercise";

export const chordDegreeHuntSeventhsExercise = createChordDegreeHuntExercise({
  id: "chord_degree_hunt_sevenths",
  addedAt: "2026-09-09",
  title: "Chords — Degree Hunt (7th Chords)",
  description: "Seventh chords, one degree at a time: read the quality, find the note, play it.",
  difficulty: "medium",
  timeInMinutes: 4,
  chords: [
    "Cmaj7",
    "Fmaj7",
    "Gmaj7",
    "Am7",
    "Dm7",
    "Em7",
    "Bm7",
    "G7",
    "C7",
    "A7",
    "D7",
    "E7",
    "Bm7b5",
  ],
  degrees: ["3", "5", "7"],
  rotateSeconds: 18,
  instructions: [
    "A seventh chord and a degree appear, e.g. 'G7 · 7th' — play the note that degree lands on.",
    "Enable Pitch Detect so the app confirms your answer; the note is revealed once you play it.",
    "The prompt never says major or minor — the chord symbol already told you, and that's the part being tested.",
    "A fresh chord appears every 18 seconds.",
  ],
  tips: [
    "Two symbols, two different 7ths: Cmaj7 has B (one fret below the root), C7 has B♭ (two frets below).",
    "The 7th is easiest to find backwards from the root's octave rather than counting 10 or 11 frets up.",
    "m7♭5 is the one that moves the 5th too — flatten it a fret.",
    "Sing the note before playing it when you can; a wrong answer you can hear is worth more than a lucky one.",
  ],
  whyItMatters:
    "Thirds and sevenths are the notes that tell major from minor from dominant — the guide tones every jazz and blues line is built on. Being able to name them on sight from the chord symbol, without spelling the whole chord first, is what makes comping and soloing over changes possible at tempo.",
});
