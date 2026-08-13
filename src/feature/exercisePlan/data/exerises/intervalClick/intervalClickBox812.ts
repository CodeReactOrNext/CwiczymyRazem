import { ALL_ROOTS, createIntervalClickExercise } from "./createIntervalClickExercise";

export const intervalClickBox812Exercise = createIntervalClickExercise({
  id: "interval_click_box_8_12",
  addedAt: "2026-08-11",
  title: "Interval Clicks — Box 8–12",
  description: "Every interval, sharp roots included, in the box that runs up to the 12th-fret octave.",
  difficulty: "hard",
  timeInMinutes: 3,
  region: { startFret: 8, endFret: 12 },
  intervalIds: ["m2", "M2", "m3", "M3", "P4", "TT", "P5", "m6", "M6", "m7", "M7"],
  roots: ALL_ROOTS,
  rotateSeconds: 75,
  instructions: [
    "Roots can now be sharps (C#, F#, A#…) and every interval is in play, tritone and major 7th included.",
    "Click one root in frets 8–12 first, then the interval measured from that spot — it has to sit within reach of the root you placed.",
    "At fret 12 each string repeats its own open note an octave up — use that to check yourself.",
  ],
  tips: [
    "The tritone is exactly half an octave: 6 frets up, and it's its own inversion — 6 frets down lands on the same note name.",
    "A major 7th is one fret below the octave; a minor 2nd is one fret above the root. Same pair of notes, opposite direction.",
    "Sharp roots are just the natural root moved a fret — find C, then step up one for C#.",
  ],
  whyItMatters:
    "Once the tritone and the 7ths are as findable as the 5th, dominant and altered sounds stop being theory you read about and become shapes you can reach for. This box is also where the neck starts repeating, so it doubles as a check on everything below it.",
});
