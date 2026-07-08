import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const metronomeGapTestExercise: Exercise = {
  id: "metronome_gap_test",
  title: "Metronome Gap Test",
  description: "Lock onto the click for two bars, then keep the pulse through the silence and tap the very next downbeat — the app measures how far off you land.",
  whyItMatters: "It reveals whether you've truly internalised the tempo or are just riding an external click. Holding the grid through silence builds the deep internal timing you need to lock in with a drummer, lead a band, and stop rushing or dragging.",
  difficulty: "medium",
  category: "theory",
  timeInMinutes: 5,
  instructions: [
    "Press Start — the metronome plays 2 bars (1·2·3·4) so you can lock onto the tempo.",
    "The click then goes silent for a few bars; keep counting the pulse in your head.",
    "Tap the very next downbeat — the “1” — with the Spacebar or a mouse click. Just one tap.",
    "Check your deviation in milliseconds; land a PERFECT and the silent gap grows by one bar."
  ],
  tips: [
    "Count “1-2-3-4” through the silence and keep breathing steadily — tension makes you rush.",
    "Judge yourself by consistency over a few tries, not one tap — the input adds a little jitter.",
    "A steady “+” (late) or “−” (early) reading means you're dragging or rushing; aim to centre it on 0."
  ],
  // No app metronome: the interactive MetronomeGapTest panel provides its own
  // click track (audible bars → silence → target). A non-null metronomeSpeed
  // would make the session auto-start its continuous metronome on top of ours.
  metronomeSpeed: null,
  relatedSkills: ["rhythm"],
};
