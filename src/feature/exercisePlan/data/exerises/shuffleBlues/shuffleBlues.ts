import {
  bar,
  beat,
  note,
} from "feature/exercisePlan/data/exerises/tabBuilders";
import type {
  Exercise,
  TablatureMeasure,
} from "feature/exercisePlan/types/exercise.types";

// A shuffled beat is a triplet with its first two notes tied: long, then short.
const LONG = 2 / 3;
const SHORT = 1 / 3;

/** The open string each chord of the blues in A is rooted on. */
const ROOT_STRING = { A: 5, D: 4, E: 6 } as const;
type Chord = keyof typeof ROOT_STRING;

/**
 * One bar of the boogie pattern: the open root with the fifth (fret 2) for one
 * beat, then with the sixth (fret 4) for the next, twice over.
 */
const boogieBar = (chord: Chord): TablatureMeasure => {
  const root = ROOT_STRING[chord];
  const shape = (fret: number) => [note(root, 0), note(root - 1, fret)];
  const shuffled = (fret: number, name?: string) => [
    beat(LONG, shape(fret), { tuplet: 3, ...(name ? { chordName: name } : {}) }),
    beat(SHORT, shape(fret), { tuplet: 3 }),
  ];
  return bar([
    ...shuffled(2, chord),
    ...shuffled(4),
    ...shuffled(2),
    ...shuffled(4),
  ]);
};

export const shuffleBoogieRiffExercise: Exercise = {
  id: "shuffle_boogie_riff",
  addedAt: "2026-11-13",
  title: "Shuffle — Boogie Riff in A",
  description:
    "The two-string boogie pattern in a shuffle feel: long–short, long–short, moving between the fifth and the sixth over A, D and E.",
  whyItMatters:
    "The shuffle is the heartbeat of blues and early rock and roll, and it cannot be read off a straight grid — the off-beat comes late, on the last third of the beat. This riff is the most direct way to get that lopsided swing into your picking hand.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Each beat is split long–short: count it as a triplet, 1-(2)-3, playing on 1 and 3.",
    "Index finger on fret 2 for one beat, then ring or pinky on fret 4 for the next — the open string below rings throughout.",
    "Pick down on the long note and up on the short one, or use all downstrokes for a heavier sound.",
    "Two bars on A, then one on D and one on E.",
  ],
  tips: [
    "If it sounds stiff, exaggerate the delay of the short note until it swings, then relax it.",
    "Rest the palm lightly on the bridge — a slightly muted boogie sounds tighter.",
    "Keep the index finger down on fret 2 while the other finger reaches for fret 4.",
  ],
  metronomeSpeed: { min: 50, max: 150, recommended: 80 },
  relatedSkills: ["rhythm", "chords"],
  tablature: [boogieBar("A"), boogieBar("A"), boogieBar("D"), boogieBar("E")],
};

const TWELVE_BARS: Chord[] = [
  "A", "A", "A", "A",
  "D", "D", "A", "A",
  "E", "D", "A", "E",
];

export const bluesTwelveBarShuffleExercise: Exercise = {
  id: "blues_twelve_bar_shuffle_a",
  addedAt: "2026-11-13",
  title: "Blues — 12-Bar Shuffle in A",
  description:
    "The full twelve-bar blues in A with the boogie shuffle pattern — the form behind thousands of songs, start to turnaround.",
  whyItMatters:
    "The twelve-bar blues is the most widely shared song form there is: know it and you can sit in on any blues jam. Playing the whole form, not a four-bar loop, is what teaches you to feel where the changes fall without counting.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 2,
  instructions: [
    "Four bars of A, two of D, two of A, then E, D, A and E to turn around.",
    "Keep the shuffle pattern identical on every chord — only the pair of strings changes.",
    "The last bar of E leads back to the top; loop the form without a pause.",
    "Once it holds together, stop reading and follow the form by ear.",
  ],
  tips: [
    "Count the bars in groups of four — the form is three lines, like the verse of a blues lyric.",
    "The change to D in bar 5 and to E in bar 9 are the ones that get missed. Think ahead to them.",
    "Record yourself playing it and solo over the recording afterwards.",
  ],
  metronomeSpeed: { min: 50, max: 150, recommended: 80 },
  relatedSkills: ["rhythm", "chords", "harmony"],
  tablature: TWELVE_BARS.map(boogieBar),
};
