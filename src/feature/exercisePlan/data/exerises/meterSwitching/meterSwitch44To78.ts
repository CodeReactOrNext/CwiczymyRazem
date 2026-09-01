import { createMeterSwitchExercise } from "./createMeterSwitchExercise";

export const meterSwitch44To78Exercise = createMeterSwitchExercise({
  id: "meter_switch_4_4_to_7_8",
  addedAt: "2026-08-31",
  title: "Meter — 4/4 ↔ 7/8",
  description:
    "Alternate a bar of 4/4 with a bar of 7/8 over one unbroken stream of eighth notes — the 7/8 bar is simply one eighth shorter.",
  whyItMatters:
    "This is the gentlest possible way into odd meters: the eighth note never changes speed, so nothing about your picking hand has to change. Only one eighth goes missing, and the ear picks that up immediately — which is why almost every prog and post-rock riff you'll meet starts from exactly this relationship.",
  difficulty: "easy",
  timeInMinutes: 3,
  metronomeSpeed: { min: 40, max: 120, recommended: 60 },
  instructions: [
    "Press play — the metronome already carries this drill's meter: a click on every eighth, accented on each group opening, across both bars.",
    "Play a continuous stream of palm-muted open E eighths — down-up, never breaking the motion.",
    "Follow the accented clicks: 1-2 1-2 1-2 1-2 in the 4/4 bar, 1-2 1-2 1-2-3 in the 7/8 bar.",
    "The last two notes of every bar jump to G and A and ring out — that pair is your warning that the meter is about to flip.",
  ],
  tips: [
    "Count out loud. Four bars in, stop counting and see whether the G–A pair still lands where it should.",
    "Do not slow down entering the 7/8 bar — nothing got faster, one eighth simply disappeared.",
    "If you get lost, loop only the 7/8 bar until it feels like home, then put the 4/4 bar back in front of it.",
  ],
  bars: [
    { timeSignature: [4, 4], groups: [2, 2, 2, 2], noteDuration: 0.5 },
    { timeSignature: [7, 8], groups: [2, 2, 3], noteDuration: 0.5 },
  ],
});
