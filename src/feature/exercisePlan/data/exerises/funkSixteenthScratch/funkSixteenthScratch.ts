import {
  bar,
  beat,
  note,
} from "feature/exercisePlan/data/exerises/tabBuilders";
import type {
  Exercise,
  TablatureNote,
} from "feature/exercisePlan/types/exercise.types";

const SIXTEENTH = 0.25;

/**
 * One bar of sixteenth notes written as a 16-character string: a letter picks
 * the sound from `sounds`, a dot is a muted scratch on the same strings.
 */
const groove = (
  pattern: string,
  sounds: Record<string, TablatureNote[]>,
  scratch: TablatureNote[],
) =>
  bar(
    pattern
      .replace(/\s/g, "")
      .split("")
      .map((step) => beat(SIXTEENTH, step === "." ? scratch : sounds[step])),
  );

const dead = (notes: TablatureNote[]) => notes.map((n) => ({ ...n, isDead: true }));

// Single notes on the D and A strings — E minor pentatonic around fret 5–7.
const LINE = {
  a: [note(4, 7)],
  g: [note(4, 5)],
  e: [note(5, 7)],
  d: [note(5, 5)],
};
const D_SCRATCH = dead([note(4, 7)]);
const A_SCRATCH = dead([note(5, 7)]);

// Three-string chord fragments on the top strings.
const E_MINOR_7 = [note(3, 7), note(2, 8), note(1, 7)];
const A_MAJOR = [note(3, 9), note(2, 10), note(1, 9)];

export const funkSixteenthScratchExercise: Exercise = {
  id: "funk_sixteenth_scratch",
  addedAt: "2026-11-13",
  title: "Funk — Sixteenth Scratch",
  description:
    "A constant sixteenth-note strum where most strokes are muted scratches and only a few are real notes — first on single strings, then with small chords.",
  whyItMatters:
    "Funk rhythm guitar is a picking hand that never stops and a fretting hand that decides which strokes are heard. Scratching the notes you leave out keeps your timing locked to the sixteenth grid, so the notes you do play land exactly where they should.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Strum down-up in sixteenth notes without ever stopping the hand: down on the beat and the 'and', up on the 'e' and the 'a'.",
    "For a scratch (×), relax the fretting fingers so they touch the strings without pressing them down.",
    "For a real note, press down just for that one stroke, then release back to the scratch.",
    "Bars 1–2: single notes on the D and A strings. Bars 3–4: three-string chords on the top strings.",
  ],
  tips: [
    "The fretting hand does the rhythm — the picking hand is only a motor.",
    "Keep the strum small and loose from the wrist; a tight arm will not survive four bars.",
    "A clean tone on the bridge-and-middle or neck pickup gives the scratches their click.",
    "Count '1 e and a' out loud and mark which syllables carry a real note.",
  ],
  metronomeSpeed: { min: 40, max: 120, recommended: 70 },
  relatedSkills: ["rhythm", "articulation"],
  tablature: [
    groove("a..a .g.. a..a .ga.", LINE, D_SCRATCH),
    groove("e..e .d.. e..e .de.", LINE, A_SCRATCH),
    groove("c..c .c.. c..c ..c.", { c: E_MINOR_7 }, dead(E_MINOR_7)),
    groove("c..c .c.. c..c ..c.", { c: A_MAJOR }, dead(A_MAJOR)),
  ],
};
