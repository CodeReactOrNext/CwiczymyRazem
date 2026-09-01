import { createMeterSwitchExercise } from "./createMeterSwitchExercise";

export const meterSwitch68To34Exercise = createMeterSwitchExercise({
  id: "meter_switch_6_8_to_3_4",
  addedAt: "2026-08-31",
  title: "Meter — 6/8 ↔ 3/4 Hemiola",
  description:
    "Six eighths in both bars: two groups of three, then three groups of two. The classic hemiola, and the foundation the other pairs stand on.",
  whyItMatters:
    "Hemiola is the oldest trick in Western rhythm and it hides inside blues shuffles, waltzes, Latin grooves and half the guitar solos ever recorded. Once six units flipping between 3+3 and 2+2+2 sits in your body, most other metric puzzles stop being puzzles and start being variations on something you already feel.",
  difficulty: "medium",
  timeInMinutes: 3,
  metronomeSpeed: { min: 40, max: 120, recommended: 60 },
  instructions: [
    "Press play — six eighth clicks a bar either way; only the accents move, which is exactly the point.",
    "Bar 1 is 6/8: accent notes 1 and 4, so it swings in two.",
    "Bar 2 is 3/4: accent notes 1, 3 and 5, so it walks in three.",
    "In the 3/4 bar the G–A pair starts on an accent; in the 6/8 bar it does not. Listen for that difference, it is the whole exercise.",
  ],
  tips: [
    "Count '1-2-3 4-5-6' against 'ONE-two ONE-two ONE-two' — same six clicks, two different homes for the weight.",
    "Try conducting the 6/8 bar in two and the 3/4 bar in three with your free hand while you play.",
    "When this is comfortable, do it without the metronome and check yourself against a recording — hemiola is where drifting shows up first.",
  ],
  bars: [
    { timeSignature: [6, 8], groups: [3, 3], noteDuration: 0.5 },
    { timeSignature: [3, 4], groups: [2, 2, 2], noteDuration: 0.5 },
  ],
});
