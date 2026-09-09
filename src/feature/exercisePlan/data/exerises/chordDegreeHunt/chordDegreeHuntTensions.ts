import { createChordDegreeHuntExercise } from "./createChordDegreeHuntExercise";

export const chordDegreeHuntTensionsExercise = createChordDegreeHuntExercise({
  id: "chord_degree_hunt_tensions",
  addedAt: "2026-09-09",
  title: "Chords — Degree Hunt (Tensions)",
  description: "Past the seventh: find the 9ths, 11ths and 13ths sitting above each chord.",
  difficulty: "hard",
  timeInMinutes: 4,
  chords: ["Cmaj7", "Fmaj7", "Gmaj7", "Am7", "Dm7", "Em7", "G7", "C7", "A7", "D7"],
  degrees: ["3", "5", "7", "9", "11", "13"],
  rotateSeconds: 15,
  instructions: [
    "A seventh chord and a degree appear — including the ones above the octave, e.g. 'Dm7 · 11th'.",
    "Play the note that degree lands on; octave doesn't matter, a 9th and a 2nd are the same note here.",
    "Enable Pitch Detect so the app confirms your answer; the note is revealed once you play it.",
    "A fresh chord appears every 15 seconds.",
  ],
  tips: [
    "Subtract 7 and you're back in familiar territory: the 9th is the 2nd, the 11th the 4th, the 13th the 6th.",
    "The 9th is two frets above the root — the fastest one to find, so use it to check you have the right root.",
    "Minor chords get asked for 9ths and 11ths, major and dominant ones for 9ths and 13ths. Those are the tensions that actually sound good over each — the 11th over a major 3rd clashes with it.",
    "Find these near a chord shape you already hold, not in isolation — that's how they end up in your playing.",
  ],
  whyItMatters:
    "Tensions are what separates a chord that sounds like a textbook from one that sounds like a record. Locating the 9th, 11th and 13th of a chord instantly is the groundwork for adding colour to voicings, for arpeggios that reach past the 7th, and for hearing why a line sounds sophisticated instead of merely correct.",
});
