import { createMeterSwitchExercise } from "./createMeterSwitchExercise";

export const meterSwitch34To58Exercise = createMeterSwitchExercise({
  id: "meter_switch_3_4_to_5_8",
  addedAt: "2026-08-31",
  title: "Meter — 3/4 ↔ 5/8",
  description:
    "The same one-eighth-shorter switch as 4/4 ↔ 7/8, in half the size — six eighths against five. The best place to start.",
  whyItMatters:
    "Short bars come back around fast, so a mistake shows up within a second instead of after four beats of drifting. That tight feedback loop is what makes this pair the fastest warm-up for odd-meter work, and it's the same skill 4/4 ↔ 7/8 asks for, just easier to hold in your head.",
  difficulty: "beginner",
  timeInMinutes: 2.5,
  metronomeSpeed: { min: 40, max: 120, recommended: 60 },
  instructions: [
    "Press play — the metronome clicks every eighth and accents each group opening on its own, in both bars.",
    "Keep an unbroken down-up stream of palm-muted open E eighths across both bars.",
    "Follow the accented clicks: 1-2 1-2 1-2 in the 3/4 bar, 1-2 1-2-3 in the 5/8 bar.",
    "The last two notes of every bar move to G and A, accented and left ringing.",
  ],
  tips: [
    "Say the groups out loud instead of counting to six and five — 'two two two, two three' is far easier to keep.",
    "Loop it slowly for a full minute before touching the tempo; this pair rewards repetition more than speed.",
    "Once the switch is automatic, move up to 4/4 ↔ 7/8 — the job is identical, only the bars are longer.",
  ],
  bars: [
    { timeSignature: [3, 4], groups: [2, 2, 2], noteDuration: 0.5 },
    { timeSignature: [5, 8], groups: [2, 3], noteDuration: 0.5 },
  ],
});
