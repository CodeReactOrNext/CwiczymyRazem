import { createMeterSwitchExercise } from "./createMeterSwitchExercise";

/** The 6/8 bar keeps the *pulse*, not the eighth: its dotted quarter has to last
 *  exactly as long as a 4/4 quarter, so the bar plays at 3/2 of the base tempo.
 *  Its two dotted-quarter beats then fill two metronome clicks, which keeps every
 *  bar line landing on a click even though the subdivision changed underneath. */
const PULSE_LOCKED = 1.5;

export const meterSwitch44To68PulseExercise = createMeterSwitchExercise({
  id: "meter_switch_4_4_to_6_8_pulse",
  addedAt: "2026-08-31",
  title: "Meter — 4/4 ↔ 6/8 Constant Pulse",
  description:
    "The hard one: the beat stays put across the change instead of the eighth, so eighths in the 6/8 bar genuinely speed up by half.",
  whyItMatters:
    "Every other pair in this set keeps the eighth note fixed and changes how many of them fit in a bar. This one does the opposite — the pulse is nailed down and the subdivision has to change speed underneath it. That is metric modulation, the device behind most tempo changes that somehow do not feel like tempo changes, and it demands a different kind of internal clock.",
  difficulty: "hard",
  timeInMinutes: 3.5,
  metronomeSpeed: { min: 40, max: 100, recommended: 55 },
  instructions: [
    "Press play — the click follows the change with you: it accents four beats in the 4/4 bar, then two in the 6/8 bar, and those two land exactly where beats 1 and 3 would have.",
    "Bar 1 is 4/4: eight eighths, two per accented click.",
    "Bar 2 is 6/8: two dotted-quarter beats, one accent each, so three notes now fit where two used to.",
    "Come back to this pair only once 4/4 ↔ 7/8 and 6/8 ↔ 3/4 are comfortable — it asks a different question than either.",
  ],
  tips: [
    "Do not read it as 'faster'. The beat is identical; you are dividing it by three instead of by two.",
    "Practise the flip on a single click first: 'one-and, one-and-a' over and over, no guitar.",
    "The G–A pair at the end of each bar always lands on the last part of the last beat — use it as your anchor when the subdivision changes.",
  ],
  bars: [
    { timeSignature: [4, 4], groups: [2, 2, 2, 2], noteDuration: 0.5, tempoChange: 1 },
    { timeSignature: [6, 8], groups: [3, 3], noteDuration: 0.5, tempoChange: PULSE_LOCKED },
  ],
});
