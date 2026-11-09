import type {
  Exercise,
  TablatureMeasure,
} from "feature/exercisePlan/types/exercise.types";

/**
 * The 40-second pieces the onboarding plays with a new player who said they
 * have a guitar at hand — one per answer to "how long have you been playing".
 * Each one is a single pass of its tab at the recommended tempo (the session
 * ends on `timeInMinutes`, so the tab never gets cut mid-phrase), kept out of
 * the library: they only make sense as a first minute in the app.
 *
 * String 1 is high e, string 6 is low E.
 */

export const FIRST_RIFF_SECONDS = 40;

type Note = [string: number, fret: number];

/** One 4/4 bar from [duration, note | null] pairs; `null` is a rest. */
const bar = (...beats: [number, Note | null][]): TablatureMeasure => ({
  timeSignature: [4, 4],
  beats: beats.map(([duration, note]) => ({
    duration,
    notes: note ? [{ string: note[0], fret: note[1] }] : [],
  })),
});

const restBar = (): TablatureMeasure => bar([4, null]);

/** A bar of eight eighth notes. */
const eighths = (...notes: Note[]): TablatureMeasure =>
  bar(...notes.map((note): [number, Note] => [0.5, note]));

// ── 0–1 year: open strings only ─────────────────────────────────────────────
// Nothing to fret, so a player who picked a guitar up today can still play it
// clean. High strings first: they read the most reliably through a phone mic.
// 9 bars + 1 bar of rest at 60 bpm = 40 s.
//
// e|-0---0---|---------|-0-0-----|---------|---------|-0-------|-0-------|---------|-0-------|
// B|---------|-0---0---|-----0-0-|---------|-----0-0-|---------|---0---0-|-0-----0-|---------|
// G|---------|---------|---------|-0-------|-0-0-----|---------|-----0---|---0-----|---------|
const E: Note = [1, 0];
const B: Note = [2, 0];
const G: Note = [3, 0];

export const firstRiffOpenStringsExercise: Exercise = {
  id: "first_riff_open_strings",
  isHiddenFromLibrary: true,
  title: "First Riff — Open Strings",
  description:
    "Three open strings, no fretting. The app listens and marks every note you hit.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: FIRST_RIFF_SECONDS / 60,
  instructions: [
    "Pick each open string once when the cursor reaches it.",
    "Let the note ring until the next one.",
  ],
  tips: [
    "Hold the pick between thumb and the side of your index finger.",
    "Keep the phone or computer close to the guitar.",
  ],
  metronomeSpeed: { min: 40, max: 80, recommended: 60 },
  relatedSkills: [],
  tablature: [
    bar([2, E], [2, E]),
    bar([2, B], [2, B]),
    bar([1, E], [1, E], [1, B], [1, B]),
    bar([2, G], [2, null]),
    bar([1, G], [1, G], [1, B], [1, B]),
    bar([2, E], [2, null]),
    bar([1, E], [1, B], [1, G], [1, B]),
    bar([1, B], [1, G], [2, B]),
    bar([4, E]),
    restBar(),
  ],
};

// ── 1–3 years: A minor pentatonic, box 1 ────────────────────────────────────
// Up and down the shape everyone learns first, one note per beat, twice.
// 12 bars + 1 bar of rest at 80 bpm = 39 s.
//
// e|-------------------5-8-|-5---------------------|---------|
// B|---------------5-8-----|---8-5-----------------|---------|
// G|-----------5-7---------|-------7-5-------------|---------|
// D|-------5-7-------------|-----------7-5---------|---------|
// A|---5-7-----------------|---------------7-5-----|---------|
// E|-5-8-------------------|-------------------8-5-|---------|
const pentatonicUp = [
  bar([1, [6, 5]], [1, [6, 8]], [1, [5, 5]], [1, [5, 7]]),
  bar([1, [4, 5]], [1, [4, 7]], [1, [3, 5]], [1, [3, 7]]),
  bar([1, [2, 5]], [1, [2, 8]], [1, [1, 5]], [1, [1, 8]]),
];
const pentatonicDown = [
  bar([1, [1, 5]], [1, [2, 8]], [1, [2, 5]], [1, [3, 7]]),
  bar([1, [3, 5]], [1, [4, 7]], [1, [4, 5]], [1, [5, 7]]),
  bar([1, [5, 5]], [1, [6, 8]], [2, [6, 5]]),
];

export const firstRiffPentatonicExercise: Exercise = {
  id: "first_riff_pentatonic",
  isHiddenFromLibrary: true,
  title: "First Riff — Pentatonic Box",
  description:
    "A minor pentatonic up and down, one note per beat. The app scores every note.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: FIRST_RIFF_SECONDS / 60,
  instructions: [
    "Play one note per click, up the shape and back down.",
    "Use one finger per fret: index on the 5th, ring or pinky on the 7th and 8th.",
  ],
  tips: [
    "Lift each finger only as far as you need to.",
    "If a note does not light up, play it a little harder.",
  ],
  metronomeSpeed: { min: 50, max: 110, recommended: 80 },
  relatedSkills: ["scales", "alternate_picking"],
  tablature: [
    ...pentatonicUp,
    ...pentatonicDown,
    ...pentatonicUp,
    ...pentatonicDown,
    restBar(),
  ],
};

// ── 3+ years: a pentatonic lead lick in eighth notes ────────────────────────
// A descending run, a climb back to the B string, then a low-string riff.
// 14 bars + 1 bar of rest at 90 bpm = 40 s.
const runDown = [
  eighths([1, 8], [1, 5], [2, 8], [2, 5], [3, 7], [3, 5], [4, 7], [4, 5]),
  bar([0.5, [3, 5]], [0.5, [3, 7]], [0.5, [2, 5]], [0.5, [2, 8]], [2, [1, 5]]),
];
const climb = [
  eighths([4, 7], [4, 5], [5, 7], [5, 5], [4, 5], [4, 7], [3, 5], [3, 7]),
  bar(
    [0.5, [2, 5]],
    [0.5, [2, 8]],
    [0.5, [2, 5]],
    [0.5, [3, 7]],
    [1, [3, 5]],
    [1, [4, 7]],
  ),
];
const lowRiff = [
  eighths([6, 5], [6, 5], [6, 8], [6, 5], [5, 7], [6, 5], [5, 5], [5, 7]),
  bar(
    [0.5, [5, 7]],
    [0.5, [4, 5]],
    [0.5, [4, 7]],
    [0.5, [4, 5]],
    [1, [5, 7]],
    [1, [6, 5]],
  ),
];

export const firstRiffLeadLickExercise: Exercise = {
  id: "first_riff_lead_lick",
  isHiddenFromLibrary: true,
  title: "First Riff — Lead Lick",
  description:
    "An A minor pentatonic lick in eighth notes, from the high strings down to a low riff.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: FIRST_RIFF_SECONDS / 60,
  instructions: [
    "Alternate pick every eighth note: down on the click, up between.",
    "Land the long notes on time and let them ring.",
  ],
  tips: [
    "Mute the strings you are not playing with the side of your picking hand.",
    "Slow the tempo down if the low riff gets messy.",
  ],
  metronomeSpeed: { min: 60, max: 130, recommended: 90 },
  relatedSkills: ["scales", "alternate_picking"],
  tablature: [
    ...runDown,
    ...runDown,
    ...climb,
    ...climb,
    ...lowRiff,
    ...lowRiff,
    runDown[0],
    bar([0.5, [2, 5]], [0.5, [2, 8]], [3, [1, 5]]),
    restBar(),
  ],
};

export const firstRiffExercises: Exercise[] = [
  firstRiffOpenStringsExercise,
  firstRiffPentatonicExercise,
  firstRiffLeadLickExercise,
];
