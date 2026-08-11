import { createIntervalClickExercise } from "./createIntervalClickExercise";

export const intervalClickBox59Exercise = createIntervalClickExercise({
  id: "interval_click_box_5_9",
  addedAt: "2026-08-11",
  title: "Intervals: Middle Box — Click Drill",
  description: "Root first, interval second — same drill, moved up to frets 5–9 with a wider interval pool.",
  difficulty: "medium",
  timeInMinutes: 3,
  region: { startFret: 5, endFret: 9 },
  intervalIds: ["M2", "m3", "M3", "P4", "P5", "M6", "m7"],
  rotateSeconds: 60,
  instructions: [
    "Same two steps as the open box: click every root in frets 5–9, then every spot of the note the interval lands on.",
    "No open strings to lean on up here — the fret-5 and fret-7 landmarks are your way in.",
    "Sevenths and 6ths join the pool, so the answer is further from the root than before.",
  ],
  tips: [
    "A minor 7th is the same shape as a 5th plus 3 frets — or two strings up, two frets back.",
    "A major 6th is one fret below the minor 7th; if you find one, the other is right there.",
    "Fret 5 on the low E is A, fret 7 is B — anchor off those instead of counting from the nut.",
  ],
  whyItMatters:
    "The middle of the neck is where most soloing happens, and it has no open strings to fall back on. Placing intervals here forces the relationships to live in your hands rather than in a fret-number lookup from the nut.",
});
