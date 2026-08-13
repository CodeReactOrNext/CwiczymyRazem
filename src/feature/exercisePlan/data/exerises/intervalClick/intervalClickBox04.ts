import { createIntervalClickExercise } from "./createIntervalClickExercise";

export const intervalClickBox04Exercise = createIntervalClickExercise({
  id: "interval_click_box_0_4",
  addedAt: "2026-08-11",
  title: "Interval Clicks — Box 0–4",
  description: "Two clicks a round: pick a root in frets 0–4, then the interval measured from it.",
  difficulty: "medium",
  timeInMinutes: 3,
  region: { startFret: 0, endFret: 4 },
  intervalIds: ["m3", "M3", "P4", "P5"],
  rotateSeconds: 60,
  instructions: [
    "A root note and an interval appear, e.g. 'A · Perfect 5th ↑'.",
    "Step 1: click ONE spot in frets 0–4 where the root lives — any of them, your pick.",
    "Step 2: click the interval measured from that exact spot (a 5th above A is E), within reach of the root you placed — the shaded area shows how far that reaches.",
    "The answer is never written down — the whole point is working it out on the neck.",
  ],
  tips: [
    "Count frets up the string you're already on: a minor 3rd is 3 frets, a major 3rd 4, a 4th 5, a 5th 7.",
    "Or use shapes: the 5th sits two strings up at the same fret (one fret higher when you cross the G–B pair).",
    "Pick the root that makes the shape easiest — placing it on a low string leaves room to reach up for the interval.",
  ],
  whyItMatters:
    "Chords, licks and scale shapes are all intervals stacked on a root. Turning 'a 5th above A' into a shape you can reach from wherever your hand already is — not just into a note name — is the step between knowing theory and being able to use it mid-song.",
});
