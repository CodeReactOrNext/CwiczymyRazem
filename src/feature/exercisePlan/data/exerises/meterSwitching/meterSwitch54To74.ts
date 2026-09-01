import { createMeterSwitchExercise } from "./createMeterSwitchExercise";

export const meterSwitch54To74Exercise = createMeterSwitchExercise({
  id: "meter_switch_5_4_to_7_4",
  addedAt: "2026-08-31",
  title: "Meter — 5/4 ↔ 7/4",
  description:
    "Long odd bars in quarter notes: five, then seven. The last quarter of every bar breaks into two eighths to announce the change.",
  whyItMatters:
    "Five and seven quarters are too long to survive on counting alone — by beat four your inner voice has already drifted. This pair trains you to hold a bar by its shape instead, which is exactly what long-form odd-meter writing asks for and what makes phrases in 5 and 7 sound composed rather than counted.",
  difficulty: "medium",
  timeInMinutes: 3.5,
  metronomeSpeed: { min: 40, max: 130, recommended: 70 },
  instructions: [
    "Press play — the metronome clicks quarters and accents beat 1 and 4 of the 5/4 bar, then 1 and 5 of the 7/4 bar.",
    "Bar 1 is 5/4 grouped 3+2: accent beats 1 and 4. Bar 2 is 7/4 grouped 4+3: accent beats 1 and 5.",
    "Play the bar in steady palm-muted quarters, then split the final quarter into two accented eighths on G and A.",
    "That split is the signal: the moment you hear the beat divide, the next bar is a different length.",
  ],
  tips: [
    "Stop counting after the first bar and let the 3+2 / 4+3 shape carry you, checking against the click only at the bar line.",
    "The split ending doubles as a fill; play it with intent and the drill starts sounding like a song.",
    "Take it slow enough that the two eighths stay dead even. Rushing that split is the most common way this exercise falls apart.",
  ],
  seam: "split",
  bars: [
    { timeSignature: [5, 4], groups: [3, 2], noteDuration: 1 },
    { timeSignature: [7, 4], groups: [4, 3], noteDuration: 1 },
  ],
});
