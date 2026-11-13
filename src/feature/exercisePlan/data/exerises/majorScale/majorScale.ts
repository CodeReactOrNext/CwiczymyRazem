import {
  bar,
  beat,
  note,
} from "feature/exercisePlan/data/exerises/tabBuilders";
import type {
  Exercise,
  TablatureBeat,
} from "feature/exercisePlan/types/exercise.types";

type Position = [string: number, fret: number];

const at = ([string, fret]: Position) => note(string, fret);

// ── Three notes per string ───────────────────────────────────────────────────

/** G major, three notes on every string, from the low G up to the high C. */
const THREE_PER_STRING: Position[] = [
  [6, 3], [6, 5], [6, 7],
  [5, 3], [5, 5], [5, 7],
  [4, 4], [4, 5], [4, 7],
  [3, 4], [3, 5], [3, 7],
  [2, 5], [2, 7], [2, 8],
  [1, 5], [1, 7], [1, 8],
];

const TRIPLET = 1 / 3;

/** Up and straight back down in eighth-note triplets: 36 notes, three bars. */
const threePerStringBars = () => {
  const run = [...THREE_PER_STRING, ...[...THREE_PER_STRING].reverse()];
  const beats = run.map((position) => beat(TRIPLET, at(position), { tuplet: 3 }));
  return [0, 12, 24].map((start) => bar(beats.slice(start, start + 12)));
};

export const majorScaleThreePerStringExercise: Exercise = {
  id: "major_scale_three_notes_per_string",
  addedAt: "2026-11-13",
  title: "Major Scale — Three Notes Per String",
  description:
    "G major with three notes on every string, played in triplets from the low E string to the high E and back.",
  whyItMatters:
    "Three-notes-per-string fingerings give every string the same picking pattern, which is why fast scale runs are almost always built on them. They also stretch the scale across seven frets, breaking the habit of seeing it as one small box.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Play three notes on each string — one string per triplet — with strict alternate picking.",
    "Use index, middle and pinky when the frets are a whole step apart twice; index, ring and pinky otherwise.",
    "Shift the hand up one fret when you reach the D string and again on the B string.",
    "At the top, turn around without stopping and come straight back down.",
  ],
  tips: [
    "The first note of every string falls on the beat — accent it lightly to stay locked to the click.",
    "Each new string starts on the opposite pick stroke from the last one. Let that happen; do not reset to a downstroke.",
    "Stretching hurts? Bring the thumb lower behind the neck rather than forcing the fingers apart.",
  ],
  metronomeSpeed: { min: 40, max: 160, recommended: 70 },
  relatedSkills: ["scales", "alternate_picking"],
  tablature: threePerStringBars(),
};

// ── Sequences in one position ────────────────────────────────────────────────

/** G major in second position, low G to the A on the high E string. */
const SECOND_POSITION: Position[] = [
  [6, 3], [6, 5],
  [5, 2], [5, 3], [5, 5],
  [4, 2], [4, 4], [4, 5],
  [3, 2], [3, 4], [3, 5],
  [2, 3], [2, 5],
  [1, 2], [1, 3], [1, 5],
];

/** The index of the high G — where both sequences come to rest. */
const HIGH_G = 14;

const degrees = (indices: number[], duration: number): TablatureBeat[] =>
  indices.map((index) => beat(duration, at(SECOND_POSITION[index])));

/** Each scale note followed by the note a third above it, climbing by step. */
const thirdsFrom = (first: number, pairs: number) =>
  Array.from({ length: pairs }, (_, i) => [first + i, first + i + 2]).flat();

export const majorScaleThirdsExercise: Exercise = {
  id: "major_scale_in_thirds",
  addedAt: "2026-11-13",
  title: "Major Scale — In Thirds",
  description:
    "Climb G major by skipping a note and stepping back: every scale note followed by the one a third above it.",
  whyItMatters:
    "Running a scale straight up and down trains your fingers, not your ear. Playing it in thirds forces you to know where every note is relative to its neighbours — and thirds are what melodies and arpeggios are actually made of.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Stay in second position: index on fret 2, one finger per fret.",
    "Play a scale note, skip one, play the next — then go back to the note you skipped and repeat from there.",
    "Use alternate picking throughout, including when the pair crosses to another string.",
    "Finish on the high G and hold it.",
  ],
  tips: [
    "Say the pattern out loud at first: one–three, two–four, three–five.",
    "When both notes of a pair sit on the same fret of neighbouring strings, roll the fingertip instead of lifting it.",
    "Once it is even, try it descending too — start from the top note and reverse every pair.",
  ],
  metronomeSpeed: { min: 40, max: 150, recommended: 70 },
  relatedSkills: ["scales", "alternate_picking", "music_theory"],
  tablature: [
    bar(degrees(thirdsFrom(0, 4), 0.5)),
    bar(degrees(thirdsFrom(4, 4), 0.5)),
    bar(degrees(thirdsFrom(8, 4), 0.5)),
    bar([...degrees(thirdsFrom(12, 2), 0.5), ...degrees([HIGH_G], 2)]),
  ],
};

/** Four scale notes in a row, starting one step higher each time. */
const foursFrom = (first: number, groups: number) =>
  Array.from({ length: groups }, (_, i) =>
    [0, 1, 2, 3].map((step) => first + i + step),
  ).flat();

export const majorScaleGroupsOfFourExercise: Exercise = {
  id: "major_scale_groups_of_four",
  addedAt: "2026-11-13",
  title: "Major Scale — Groups of Four",
  description:
    "G major in sixteenth notes, four notes up, one step back, four notes up again — the classic scale sequence.",
  whyItMatters:
    "Groups of four are the pattern behind countless rock and fusion runs. Because each group starts one note higher, your picking hand meets every possible string crossing in the scale — a complete workout disguised as one simple rule.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Stay in second position, one finger per fret, strict alternate picking.",
    "Play four scale notes going up, then start the next group from the second note of the one before.",
    "Each group of four fills exactly one beat — the first note of every group lands on the click.",
    "The last bar reaches the top, comes down one group and settles on the high G.",
  ],
  tips: [
    "Start far slower than feels necessary; the pattern is easy to understand and hard to keep even.",
    "Accent the first note of each group to hear the sequence instead of a stream of notes.",
    "Speed comes from keeping the fingers close to the strings, not from picking harder.",
  ],
  metronomeSpeed: { min: 40, max: 130, recommended: 60 },
  relatedSkills: ["scales", "alternate_picking"],
  tablature: [
    bar(degrees(foursFrom(0, 4), 0.25)),
    bar(degrees(foursFrom(4, 4), 0.25)),
    bar(degrees(foursFrom(8, 4), 0.25)),
    bar([
      ...degrees(foursFrom(12, 1), 0.25),
      ...degrees([15, 14, 13, 12], 0.25),
      ...degrees([HIGH_G], 2),
    ]),
  ],
};
