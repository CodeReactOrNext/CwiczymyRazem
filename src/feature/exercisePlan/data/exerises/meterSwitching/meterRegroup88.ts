import { createMeterSwitchExercise } from "./createMeterSwitchExercise";

export const meterRegroup88Exercise = createMeterSwitchExercise({
  id: "meter_regroup_8_8",
  addedAt: "2026-08-31",
  title: "Meter — 8/8 Regrouped (3+3+2 ↔ 2+3+3)",
  description:
    "Eight eighths in every bar, grouped 3+3+2 and then 2+3+3. The bar length never changes — the groove flips inside out.",
  whyItMatters:
    "Eight eighths is a bar of 4/4 in disguise, so the regrouping happens over a pulse you already own. 3+3+2 is the backbone of half the world's dance music, and hearing it flip to 2+3+3 without the bar getting longer teaches the ear that groove is grouping, not meter.",
  difficulty: "medium",
  timeInMinutes: 3,
  metronomeSpeed: { min: 40, max: 120, recommended: 60 },
  instructions: [
    "Press play — eight eighth clicks a bar, accented 1-4-7 in the first bar and 1-3-6 in the second, so the flip is in the click itself.",
    "Bar 1 is 3+3+2: accent notes 1, 4 and 7. Bar 2 is 2+3+3: accent notes 1, 3 and 6.",
    "Keep the unaccented eighths dead even; the only thing that may change between the two bars is where the weight lands.",
    "The closing G–A pair falls inside the last group both times — in bar 1 it is that group, in bar 2 it ends it.",
  ],
  tips: [
    "3+3+2 is the clave you already know from countless songs — lean on that familiarity, then fight for 2+3+3.",
    "Tap the accents on your leg with no guitar first; when the flip is easy sitting still, pick the guitar back up.",
    "Try it with a distorted tone and let the G–A pair ring — the pattern turns into a riff, not a drill.",
  ],
  bars: [
    { timeSignature: [8, 8], groups: [3, 3, 2], noteDuration: 0.5 },
    { timeSignature: [8, 8], groups: [2, 3, 3], noteDuration: 0.5 },
  ],
});
