import { INTERVALS } from "feature/exercisePlan/intervals/intervalDefinitions";

import { ALL_ROOTS, createIntervalClickExercise } from "./createIntervalClickExercise";

export const intervalClickWholeFretboardExercise = createIntervalClickExercise({
  id: "interval_click_whole_fretboard",
  addedAt: "2026-08-11",
  title: "Intervals: Whole Fretboard — Click Drill",
  description: "Every interval, every root, the full neck from open to fret 12 — no box to hide in.",
  difficulty: "hard",
  timeInMinutes: 5,
  region: { startFret: 0, endFret: 12 },
  intervalIds: INTERVALS.map((interval) => interval.id),
  roots: ALL_ROOTS,
  rotateSeconds: 90,
  instructions: [
    "No fret window this time — the root can be anywhere across the whole neck, frets 0 to 12.",
    "Click one spot of the root, anywhere you like, then the interval measured from that spot — within reach of it, not somewhere else on the neck.",
    "This is the boxes you already trained, combined — lean on the landmarks (open strings, fret 5, fret 7, fret 12) instead of scanning fret by fret.",
  ],
  tips: [
    "Place the root where you'd actually play it, then read the interval off the shape — that's the skill this rewards.",
    "Fret 12 repeats each string's open note an octave up, so the second half of the neck mirrors the first.",
    "If the root has a sharp, find the natural first and step one fret up.",
  ],
  whyItMatters:
    "Real playing doesn't stay inside one box — a solo or a chord voicing can ask for any interval anywhere on the neck. This drill drops the training wheels of a fixed window so the recall has to work everywhere, which is the point of learning the fretboard in the first place.",
});
