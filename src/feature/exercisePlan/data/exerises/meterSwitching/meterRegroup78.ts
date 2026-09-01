import { createMeterSwitchExercise } from "./createMeterSwitchExercise";

export const meterRegroup78Exercise = createMeterSwitchExercise({
  id: "meter_regroup_7_8",
  addedAt: "2026-08-31",
  title: "Meter — 7/8 Regrouped (2+2+3 ↔ 3+2+2)",
  description:
    "Every bar is 7/8 and seven eighths long. Only the accents move — 2+2+3 in one bar, 3+2+2 in the next.",
  whyItMatters:
    "On paper nothing changes here: same meter, same note count, same tempo. Everything that makes the two bars sound different lives in the accents, which forces you to hear grouping instead of counting to seven. That is the switch from surviving odd meters to actually playing them.",
  difficulty: "medium",
  timeInMinutes: 3,
  metronomeSpeed: { min: 40, max: 110, recommended: 55 },
  instructions: [
    "Press play — the metronome states both groupings for you: seven eighth clicks a bar, accented 1-3-5 in the first, 1-4-6 in the second.",
    "Bar 1 is 2+2+3: accent notes 1, 3 and 5. Bar 2 is 3+2+2: accent notes 1, 4 and 6.",
    "Make the accented notes clearly louder and let the notes between them stay quiet and tight under the palm.",
    "The G–A pair closing each bar carries the last accent — the long group in bar 1, the last short group in bar 2.",
  ],
  tips: [
    "Chant it: 'ta-ka ta-ka ta-ki-ta' then 'ta-ki-ta ta-ka ta-ka'. Get your mouth right and your hand follows.",
    "Once it sits, mute the metronome and keep going. Holding the flip with no click is the real test.",
    "Record a loop and play it back — if you can't tell the two bars apart on the recording, the accents are too polite.",
    "This is where Balkan and prog grooves come from; the same seven notes carry two completely different dances.",
  ],
  bars: [
    { timeSignature: [7, 8], groups: [2, 2, 3], noteDuration: 0.5 },
    { timeSignature: [7, 8], groups: [3, 2, 2], noteDuration: 0.5 },
  ],
});
