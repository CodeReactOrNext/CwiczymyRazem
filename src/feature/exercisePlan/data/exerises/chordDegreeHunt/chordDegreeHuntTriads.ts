import { createChordDegreeHuntExercise } from "./createChordDegreeHuntExercise";

export const chordDegreeHuntTriadsExercise = createChordDegreeHuntExercise({
  id: "chord_degree_hunt_triads",
  addedAt: "2026-09-09",
  title: "Chords — Degree Hunt (Triads)",
  description: "A chord and a function appear; find that function on the neck and play it. No clock.",
  difficulty: "easy",
  timeInMinutes: 3,
  chords: ["C", "G", "D", "A", "E", "F", "Am", "Em", "Dm", "Bm"],
  degrees: ["3", "5"],
  // The on-ramp: the label already says whether the 3rd is flat, so the work is
  // finding it on the neck rather than deducing it. The harder variants hide the
  // quality behind an ordinal and make you read the chord symbol first.
  degreeLabels: "function",
  // Nothing rotates until the note is played. A beginner counting frets should
  // not lose the chord halfway through counting.
  rotateSeconds: 0,
  advanceOn: "solved",
  instructions: [
    "A chord and a function appear, e.g. 'Am · ♭3' — play the note that function lands on.",
    "Enable Pitch Detect so the app confirms your answer; the note is revealed once you play it.",
    "Any octave, anywhere on the neck — the note name is the answer, not a particular fret.",
    "There's no timer: the chord stays until you find it. Use Next to skip one.",
  ],
  tips: [
    "Count from the root: ♭3 is 3 frets up the string, 3 is 4 frets, 5 is 7.",
    "The 5 is also the same fret two strings across — the shape you already know from power chords.",
    "Say the function out loud as you land on it ('that's the ♭3 of Am'); the name is what has to stick, not the fret.",
    "Look for the function near a chord shape you can already grab, so it ends up somewhere your hand actually goes.",
  ],
  whyItMatters:
    "Chord shapes are memorised as finger patterns long before anyone can say what's under those fingers. Being able to point at the ♭3 or the 5 of a chord on demand is what turns a shape into something you can build an arpeggio from, target in a solo, or move somewhere else on the neck.",
});
