import {
  SECOND_POSITION,
  THREE_PER_STRING,
} from "feature/exercisePlan/data/exerises/majorScale/majorScale";
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

const ADDED = "2026-11-28";
const TRIPLET = 1 / 3;

const at = ([string, fret]: Position) => note(string, fret);

// ── Diagonal pentatonic ──────────────────────────────────────────────────────

/**
 * A minor pentatonic from the low G to the E at fret 12, two notes then three
 * per string. The third note of every three is reached by sliding, which moves
 * the hand up one box: fret 3 → 5 → 7 → 10.
 */
const DIAGONAL: Position[] = [
  [6, 3], [6, 5],
  [5, 3], [5, 5], [5, 7],
  [4, 5], [4, 7],
  [3, 5], [3, 7], [3, 9],
  [2, 8], [2, 10],
  [1, 8], [1, 10], [1, 12],
];

/** The notes a slide leaves from, per direction. The arrival is picked. */
const SLIDES_UP = new Set(["5/5", "3/7", "1/10"]);
const SLIDES_DOWN = new Set(["1/12", "3/9", "5/7"]);

const diagonalBeat = (
  [string, fret]: Position,
  slides: Set<string>,
  duration = 0.5,
): TablatureBeat =>
  beat(
    duration,
    note(string, fret, slides.has(`${string}/${fret}`) ? { slideOut: 1 } : {}),
  );

const diagonalBars = () => {
  const top = DIAGONAL[DIAGONAL.length - 1];
  const up = DIAGONAL.slice(0, -1).map((p) => diagonalBeat(p, SLIDES_UP));
  const down = [...DIAGONAL]
    .reverse()
    .slice(1)
    .map((p) => diagonalBeat(p, SLIDES_DOWN));
  return [
    bar(up.slice(0, 8)),
    bar([...up.slice(8), diagonalBeat(top, SLIDES_DOWN, 1)]),
    bar(down.slice(0, 8)),
    bar([...down.slice(8), beat(1, note(6, 5))]),
  ];
};

export const pentatonicDiagonalShiftsExercise: Exercise = {
  id: "pentatonic_diagonal_position_shifts",
  addedAt: ADDED,
  title: "Pentatonic — Diagonal Position Shifts",
  description:
    "A minor pentatonic as one line from fret 3 to fret 12: two notes, then three with a slide, crossing four boxes on the way up and back.",
  whyItMatters:
    "Playing every box one after another still leaves five separate shapes in your head. A diagonal run joins them: each slide carries the hand into the next box mid-line, so the neck becomes one long road instead of five rooms.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 2,
  instructions: [
    "Play two notes on the low E string, three on the A string, two on the D, three on the G, two on the B, three on the high E.",
    "On every string with three notes, slide the ring finger up two frets to reach the third one — and pick it as you arrive.",
    "After each slide the index finger sits two or three frets higher than before. Start the next string from there.",
    "Hold the top note for a beat, then come back the same way: the ring finger slides down first, the index finger finishes the string.",
    "Step up from the low G to finish on the root, A.",
  ],
  tips: [
    "The ring finger does every slide in both directions. If another finger wants to take over, slow down.",
    "A slide is an eighth note like the others — arrive on the click, not before it.",
    "Name the fret the index finger lands on after each shift: 5, 7, 10. Those are the doors between boxes.",
  ],
  metronomeSpeed: { min: 40, max: 150, recommended: 70 },
  relatedSkills: ["scales", "alternate_picking", "articulation"],
  tablature: diagonalBars(),
};

// ── A minor in fifth position ────────────────────────────────────────────────

/** A natural minor in fifth position, low A up to the C on the high E string. */
const A_MINOR: Position[] = [
  [6, 5], [6, 7], [6, 8],
  [5, 5], [5, 7], [5, 8],
  [4, 5], [4, 7],
  [3, 4], [3, 5], [3, 7],
  [2, 5], [2, 6], [2, 8],
  [1, 5], [1, 7], [1, 8],
];

/** The index of the high A — two octaves above the first note. */
const HIGH_A = 14;

/** Step `n` of the scale run up to the high A and back down, without end. */
const zigzag = (step: number) => {
  const period = 2 * HIGH_A;
  const place = step % period;
  return place <= HIGH_A ? place : period - place;
};

/** `count` notes of the zigzag from step `from`, all the same length. */
const zigzagBeats = (
  from: number,
  count: number,
  duration: number,
  tuplet?: number,
): TablatureBeat[] =>
  Array.from({ length: count }, (_, i) =>
    beat(duration, at(A_MINOR[zigzag(from + i)]), tuplet ? { tuplet } : {}),
  );

const minorDegrees = (indices: number[], duration: number): TablatureBeat[] =>
  indices.map((index) => beat(duration, at(A_MINOR[index])));

export const minorScaleRhythmPyramidExercise: Exercise = {
  id: "minor_scale_rhythm_pyramid",
  addedAt: ADDED,
  title: "Minor Scale — Rhythm Pyramid",
  description:
    "A natural minor running up and down without a break while the rhythm changes every bar: quarter notes, eighths, triplets, sixteenths — and back down again.",
  whyItMatters:
    "Most players know a scale at one speed. Music asks for it at all of them, often inside one phrase. Changing the subdivision while the click stays put teaches the hands to follow the beat instead of the habit — the difference between running a scale and playing in time.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 2,
  instructions: [
    "Stay in fifth position, one finger per fret, strict alternate picking.",
    "The scale never restarts: each bar picks up on the note where the last one stopped.",
    "Bar 1 is one note per click, bar 2 two, bar 3 three, bar 4 four. Bars 5 and 6 come back through triplets and eighths.",
    "Finish on the low A and let it ring for the whole last bar.",
  ],
  tips: [
    "Set the tempo by bar 4. If the sixteenths are not clean, the whole pyramid is too fast.",
    "The hard moments are the bar lines. Count the new subdivision in your head one beat before it starts.",
    "Triplets are where most people rush. Say “tri-po-let” on each click until they sit evenly.",
  ],
  metronomeSpeed: { min: 40, max: 120, recommended: 60 },
  relatedSkills: ["scales", "rhythm", "alternate_picking"],
  tablature: [
    bar(zigzagBeats(0, 4, 1)),
    bar(zigzagBeats(4, 8, 0.5)),
    bar(zigzagBeats(12, 12, TRIPLET, 3)),
    bar(zigzagBeats(24, 16, 0.25)),
    bar(zigzagBeats(40, 12, TRIPLET, 3)),
    bar(minorDegrees([4, 3, 2, 1, 0, 1, 2, 1], 0.5)),
    bar(minorDegrees([0], 4)),
  ],
};

// ── Scale over changes ───────────────────────────────────────────────────────

/** One bar of eighth notes over `chord`; the first note is the target. */
const overChord = (chord: string, indices: number[]) =>
  bar(
    indices.map((index, i) =>
      beat(0.5, at(A_MINOR[index]), i === 0 ? { chordName: chord } : {}),
    ),
  );

export const minorScaleChordToneTargetsExercise: Exercise = {
  id: "minor_scale_chord_tone_targets",
  addedAt: ADDED,
  title: "Minor Scale — Chord Tone Targets",
  description:
    "One scale over Am – F – C – G, aimed so that beat one of every bar lands on a note of the chord: roots the first time round, thirds the second.",
  whyItMatters:
    "A scale tells you which notes are safe; it does not tell you which one to play now. Landing on a chord tone as the chord changes is what makes a line sound like it belongs to the song — and it is the first real step from running scales to soloing.",
  difficulty: "medium",
  category: "theory",
  timeInMinutes: 2.5,
  instructions: [
    "Stay in fifth position. Every note comes from A natural minor — the same seven notes fit all four chords.",
    "Bars 1–4: the first note of each bar is the root of the chord — A, F, C, G.",
    "Bars 5–8: the first note is the third of the chord — C, A, E, B. Same chords, a sweeter landing.",
    "The last note of a bar is always one scale step away from the next target. Hear it pulling you there.",
  ],
  tips: [
    "Lean on the first note of every bar a little, so the landing is heard.",
    "Say the chord name as it changes. You should always know which chord you are standing on.",
    "Then leave the tab: keep the eight targets and improvise your own way between them.",
  ],
  metronomeSpeed: { min: 40, max: 140, recommended: 70 },
  relatedSkills: ["scales", "improvisation", "harmony"],
  tablature: [
    overChord("Am", [7, 8, 9, 10, 11, 10, 11, 13]),
    overChord("F", [12, 11, 10, 9, 10, 11, 12, 10]),
    overChord("C", [9, 10, 11, 12, 11, 10, 11, 12]),
    overChord("G", [13, 14, 15, 14, 13, 12, 11, 10]),
    overChord("Am", [9, 8, 7, 8, 9, 10, 9, 8]),
    overChord("F", [7, 8, 9, 10, 11, 12, 13, 12]),
    overChord("C", [11, 12, 13, 14, 13, 12, 13, 14]),
    overChord("G", [15, 14, 13, 12, 11, 10, 9, 8]),
  ],
};

// ── Diatonic triads ──────────────────────────────────────────────────────────

/** The triad on each step of G major, by the index of its root in the scale. */
const DIATONIC_TRIADS = ["G", "Am", "Bm", "C", "D", "Em", "F#dim", "G"];

/**
 * Half a bar on one triad: root, third, fifth and back to the third going up;
 * fifth, third, root and back to the third coming down. A triad is every other
 * note of the scale, so its tones sit two scale steps apart.
 */
const triad = (degree: number, direction: "up" | "down"): TablatureBeat[] => {
  const [root, third, fifth] = [degree, degree + 2, degree + 4];
  const order =
    direction === "up" ? [root, third, fifth, third] : [fifth, third, root, third];
  return order.map((index, i) =>
    beat(
      0.5,
      at(SECOND_POSITION[index]),
      i === 0 ? { chordName: DIATONIC_TRIADS[degree] } : {},
    ),
  );
};

const triadPair = (first: number, second: number, direction: "up" | "down") =>
  bar([...triad(first, direction), ...triad(second, direction)]);

export const diatonicTriadArpeggiosExercise: Exercise = {
  id: "arpeggios_diatonic_triads_g",
  addedAt: ADDED,
  title: "Arpeggios — Diatonic Triads in G",
  description:
    "The seven chords hidden in G major, played as arpeggios one scale step apart: G, Am, Bm, C, D, Em, F#dim — up to the octave and back.",
  whyItMatters:
    "Every chord in a key is just the scale with every other note left out. Playing the triads in order shows you where the chords of a song live inside the scale shape you already know — the bridge from scales to chords, and to solos that follow the harmony.",
  difficulty: "medium",
  category: "theory",
  timeInMinutes: 2.5,
  instructions: [
    "Stay in second position: index on fret 2, one finger per fret.",
    "Each triad takes two beats: root, third, fifth, and back to the third. Then move up one scale note and do it again.",
    "Bars 1–4 climb from G to the G an octave higher. Bars 5–8 come down, each triad now starting from its fifth.",
    "Use alternate picking and finish on the low G.",
  ],
  tips: [
    "Say the chord name as you start each triad. The order — major, minor, minor, major, major, minor, diminished — is the same in every major key.",
    "When two notes sit on the same fret of neighbouring strings, roll the fingertip across instead of lifting it.",
    "Notice that only the F# triad sounds tense. That is the diminished chord, and it wants to resolve to G.",
  ],
  metronomeSpeed: { min: 40, max: 140, recommended: 65 },
  relatedSkills: ["harmony", "music_theory", "scales"],
  tablature: [
    triadPair(0, 1, "up"),
    triadPair(2, 3, "up"),
    triadPair(4, 5, "up"),
    triadPair(6, 7, "up"),
    triadPair(6, 5, "down"),
    triadPair(4, 3, "down"),
    triadPair(2, 1, "down"),
    bar([
      ...[4, 2, 0, 2].map((index, i) =>
        beat(0.5, at(SECOND_POSITION[index]), i === 0 ? { chordName: "G" } : {}),
      ),
      beat(2, at(SECOND_POSITION[0])),
    ]),
  ],
};

// ── String skipping ──────────────────────────────────────────────────────────

const onString = (string: number) =>
  THREE_PER_STRING.filter(([s]) => s === string);

/** Jump over a string, come back one, jump again. */
const SKIP_UP = [6, 4, 5, 3, 4, 2, 3, 1];
const SKIP_DOWN = [1, 3, 2, 4, 3, 5, 4, 6];

const skippingBars = () => {
  const up = SKIP_UP.flatMap(onString);
  const down = SKIP_DOWN.flatMap((string) => [...onString(string)].reverse());
  const beats = [...up, ...down].map((position) =>
    beat(TRIPLET, at(position), { tuplet: 3 }),
  );
  return [0, 12, 24, 36].map((start) => bar(beats.slice(start, start + 12)));
};

export const stringSkippingMajorScaleExercise: Exercise = {
  id: "string_skipping_major_scale",
  addedAt: ADDED,
  title: "String Skipping — Major Scale",
  description:
    "G major, three notes per string, but never on the next string: jump over one, come back one, jump again — all the way up and down.",
  whyItMatters:
    "Scales run string by string sound like scales. Skipping a string puts wide leaps between the groups of three, which turns the same fingering into something melodic — and makes the picking hand find strings it cannot feel its way to.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 2,
  instructions: [
    "Play three notes per string in triplets, one string per beat, with strict alternate picking.",
    "Going up, the strings come in this order: low E, D, A, G, D, B, G, high E.",
    "Coming down, each string is played from its highest note: high E, G, B, D, G, A, D, low E.",
    "The hand sits one fret higher on the D and G strings and one more on the B and high E — move it during the jump.",
  ],
  tips: [
    "Look at the picking hand, not the fretting hand. The frets are the easy part here.",
    "Rest the side of the palm lightly on the strings you skip, so they stay silent.",
    "Loop a single jump — low E to D and back — until the pick lands without searching, then play the whole line.",
  ],
  metronomeSpeed: { min: 40, max: 130, recommended: 55 },
  relatedSkills: ["string_skipping", "scales", "alternate_picking"],
  tablature: skippingBars(),
};
