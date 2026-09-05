import { createMeterSwitchExercise } from "./createMeterSwitchExercise";

/** A triplet eighth sounds for a third of a quarter — the compressed value the
 *  tablature model stores, which `tuplet: 3` re-expands into notated eighths. */
const TRIPLET_EIGHTH = 1 / 3;

export const meterSwitch128To44Exercise = createMeterSwitchExercise({
  id: "meter_switch_12_8_to_4_4",
  addedAt: "2026-08-31",
  title: "Meter — 12/8 ↔ 4/4 Triplets",
  description:
    "The hemiola blown up to twelve units: a 12/8 bar grouped 3+3+3+3, answered by a 4/4 bar of triplets grouped 4+4+4.",
  whyItMatters:
    "Twelve is the smallest number that splits cleanly into both threes and fours, which is why it is the playground for every three-against-four idea in music. Feeling twelve as four groups of three and then as three groups of four — without the notes changing speed — is the same skill as 6/8 versus 3/4, at the scale where real riffs and solos actually use it.",
  difficulty: "hard",
  timeInMinutes: 3.5,
  metronomeSpeed: { min: 40, max: 100, recommended: 50 },
  instructions: [
    "Press play — the click marks quarter notes here, accenting each bar line plus the middle of the 12/8 bar. The groupings themselves are yours to play; they don't land on quarters.",
    "Bar 1 is 12/8 grouped 3+3+3+3: accent notes 1, 4, 7 and 10, so it moves in four.",
    "Bar 2 is 4/4 in triplets, grouped 4+4+4: accent notes 1, 5 and 9, so it moves in three across the beat.",
    "Nothing speeds up between the bars — twelve notes stay twelve notes, only the accent spacing changes from three to four.",
  ],
  tips: [
    "The 4+4+4 accents deliberately fight the quarter-note pulse. Keep the metronome on and let them clash — that friction is the point.",
    "If bar 2 collapses, count '1-2-3-4' out loud over the triplet clicks until the two layers stop arguing.",
    "Play the 12/8 bar as a shuffle and the 4/4 bar as a polyrhythm and you will hear why so many blues-rock solos live in this pair.",
  ],
  bars: [
    { timeSignature: [12, 8], groups: [3, 3, 3, 3], noteDuration: 0.5 },
    { timeSignature: [4, 4], groups: [4, 4, 4], noteDuration: TRIPLET_EIGHTH, tuplet: 3 },
  ],
  // The only pair whose two bars don't share a note length — eighths against triplet
  // eighths — so no grid can sit on both, and meterGridFor rightly declines. A plain
  // quarter grid is still worth having: the bars are 6 and 4 quarters long, which is
  // 10 entries, and that alone keeps the click's bar line on the tab's bar line
  // instead of walking away from it. Accents mark each bar start plus quarter 3 of
  // the 12/8 bar, which is its third group — the only other grouping that lands on a
  // quarter. Everything else in the grouping the player supplies.
});
