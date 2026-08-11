import { createIntervalClickExercise } from "./createIntervalClickExercise";

export const intervalClickSprintExercise = createIntervalClickExercise({
  id: "interval_click_sprint_dg",
  addedAt: "2026-08-11",
  title: "Intervals: Sprint on D & G — Click Drill",
  description: "Two strings, the whole first octave, a fresh interval every 30 seconds.",
  difficulty: "medium",
  timeInMinutes: 3,
  region: { startFret: 0, endFret: 12 },
  strings: [3, 4],
  intervalIds: ["M2", "m3", "M3", "P4", "P5", "M6", "m7"],
  rotateSeconds: 30,
  instructions: [
    "Only the D and G strings are live, but the whole neck up to fret 12 is.",
    "Click both spots of the root, then both spots of the note the interval lands on — four clicks per round.",
    "Rounds are short on purpose: answer from the shape, not by counting frets one at a time.",
  ],
  tips: [
    "D and G are a perfect 4th apart, so the same note sits 5 frets lower on the G string than on the D.",
    "Two adjacent strings is exactly how 5ths, octaves and 4ths get played in real riffs — this is the shape you'll actually use.",
    "If you find the root on one string, the same note on the other is 5 frets away — check yourself with that every round.",
  ],
  whyItMatters:
    "Speed is what makes fretboard knowledge usable on stage. A narrow two-string scope with a short clock trains the instant recall that a wide, unhurried box never will.",
});
