import { createIntervalClickExercise } from "./createIntervalClickExercise";

export const intervalClickBox04Exercise = createIntervalClickExercise({
  id: "interval_click_box_0_4",
  addedAt: "2026-08-11",
  title: "Intervals: Open Box — Click Drill",
  description: "Click every spot of the root in frets 0–4, then every spot of the note the interval lands on.",
  difficulty: "medium",
  timeInMinutes: 3,
  region: { startFret: 0, endFret: 4 },
  intervalIds: ["m3", "M3", "P4", "P5"],
  rotateSeconds: 60,
  instructions: [
    "A root note and an interval appear, e.g. 'A · Perfect 5th ↑'.",
    "Step 1: click every spot in frets 0–4 where the ROOT lives — all 6 strings.",
    "Step 2: work out the note the interval lands on (a 5th above A is E) and click every spot where THAT note lives.",
    "The answer is never written down — the whole point is working it out on the neck.",
  ],
  tips: [
    "Count frets up the string you're already on: a minor 3rd is 3 frets, a major 3rd 4, a 4th 5, a 5th 7.",
    "Or use shapes: the 5th sits two strings up at the same fret (one fret higher when you cross the G–B pair).",
    "Say the answer out loud before your first click — deciding once beats hunting cell by cell.",
  ],
  whyItMatters:
    "Chords, licks and scale shapes are all intervals stacked on a root. Turning 'a 5th above A' into a note name and then into every place that note sits under your fingers is the step between knowing theory and being able to use it mid-song.",
});
