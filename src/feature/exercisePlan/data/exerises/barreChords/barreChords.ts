import {
  bar,
  beat,
  note,
} from "feature/exercisePlan/data/exerises/tabBuilders";
import type {
  Exercise,
  TablatureNote,
} from "feature/exercisePlan/types/exercise.types";

/** The E-shape major barre chord with the barre on `fret`, low string first. */
const majorBarre = (fret: number): TablatureNote[] => [
  note(6, fret),
  note(5, fret + 2),
  note(4, fret + 2),
  note(3, fret + 1),
  note(2, fret),
  note(1, fret),
];

const ring = (n: TablatureNote) => ({ ...n, isLetRing: true });

// G at the 3rd fret, built up from the top strings down.
const G_BARRE = majorBarre(3);

/** Fretting fingers of the shape, low string first: the index is the barre. */
const BARRE_FINGERS = [1, 3, 4, 2, 1, 1] as const;

/** The same chord with every note's finger marked, for the drill that teaches the shape. */
const G_FINGERED: TablatureNote[] = G_BARRE.map((n, i) => ({
  ...n,
  finger: BARRE_FINGERS[i],
}));
const TOP_TWO = G_FINGERED.slice(4);
const TOP_THREE = G_FINGERED.slice(3);
const TOP_FOUR = G_FINGERED.slice(2);

export const barreBuildingExercise: Exercise = {
  id: "barre_building_the_barre",
  addedAt: "2026-11-13",
  title: "Barre Chords — Building the Barre",
  description:
    "Grow a full barre chord two strings at a time, picking every string on its own so you can hear which one is not ringing.",
  whyItMatters:
    "The barre chord is the first real wall most players hit. Trying to clamp all six strings at once teaches tension, not technique — adding strings one group at a time lets your index finger find the angle and pressure that works before the full shape asks for it.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 2,
  instructions: [
    "Bar 1: lay your index finger flat across the two highest strings at fret 3 and pick them one by one.",
    "Bar 2: add the middle finger on the G string, fret 4.",
    "Bar 3: add the pinky on the D string, fret 5.",
    "Bar 4: stretch the index finger across all six strings, add the ring finger on the A string, fret 5, and pick the full G chord string by string.",
    "The small number beside each note is the finger that frets it: 1 index, 2 middle, 3 ring, 4 pinky.",
    "Whenever a string is dead or buzzing, stop and adjust the index finger before going on.",
  ],
  tips: [
    "Roll the index finger slightly onto its bony side — the soft pad in the middle is what lets strings buzz.",
    "Bring your elbow in towards your body and keep the thumb low behind the neck.",
    "The weight of your arm pulling back does most of the work; squeezing with the thumb only tires the hand.",
    "Fret 3 is easier than fret 1. Once the shape rings here, move it down two frets and you have F.",
  ],
  metronomeSpeed: { min: 40, max: 100, recommended: 60 },
  relatedSkills: ["chords"],
  tablature: [
    bar([
      beat(1, ring(TOP_TWO[0])),
      beat(1, ring(TOP_TWO[1])),
      beat(2, TOP_TWO),
    ]),
    bar([
      beat(1, ring(TOP_THREE[0])),
      beat(1, ring(TOP_THREE[1])),
      beat(1, ring(TOP_THREE[2])),
      beat(1, TOP_THREE, { chordName: "G" }),
    ]),
    bar([
      ...TOP_FOUR.map((n) => beat(0.5, ring(n))),
      beat(2, TOP_FOUR, { chordName: "G" }),
    ]),
    bar([
      ...G_FINGERED.map((n) => beat(0.5, ring(n))),
      beat(1, G_FINGERED, { chordName: "G" }),
    ]),
  ],
};

const E_OPEN = majorBarre(0);
const F_BARRE = majorBarre(1);
const A_MINOR: TablatureNote[] = [
  note(5, 0),
  note(4, 2),
  note(3, 2),
  note(2, 1),
  note(1, 0),
];
/** The A-minor shape moved up two frets behind a barre. */
const B_MINOR: TablatureNote[] = A_MINOR.map((n) => note(n.string, n.fret + 2));

const strums = (chord: TablatureNote[], name: string, count: number) =>
  Array.from({ length: count }, (_, i) =>
    beat(1, chord, i === 0 ? { chordName: name } : {}),
  );

export const barreOpenToBarreExercise: Exercise = {
  id: "barre_open_to_barre",
  addedAt: "2026-11-13",
  title: "Barre Chords — Open to Barre",
  description:
    "Change between open chords and the barre chords built from the same shapes: E to F and G, A minor to B minor.",
  whyItMatters:
    "A barre chord is an open chord with your index finger standing in for the nut. Seeing E become F and A minor become B minor makes the whole neck available, and practising the change itself is what gets barre chords into real songs.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 2,
  instructions: [
    "Finger the open E with your middle, ring and pinky — leaving the index free for the barre.",
    "Slide that shape up one fret and lay the index finger across fret 1: that is F.",
    "Do the same with A minor: refinger it without the index, move it up two frets, barre fret 2 for B minor.",
    "Strum once per beat and change exactly on the beat, even if the new chord is not clean yet.",
  ],
  tips: [
    "Place the barre last at first, then work towards landing all fingers together.",
    "Keep the shape fingers close to the strings during the slide.",
    "A late clean chord is worse than an on-time rough one — the rhythm comes first, the clarity follows.",
  ],
  metronomeSpeed: { min: 40, max: 120, recommended: 60 },
  relatedSkills: ["chords", "rhythm"],
  tablature: [
    bar([...strums(E_OPEN, "E", 2), ...strums(F_BARRE, "F", 2)]),
    bar([...strums(E_OPEN, "E", 2), ...strums(G_BARRE, "G", 2)]),
    bar([...strums(A_MINOR, "Am", 2), ...strums(B_MINOR, "Bm", 2)]),
    bar([
      ...strums(G_BARRE, "G", 2),
      ...strums(F_BARRE, "F", 1),
      ...strums(E_OPEN, "E", 1),
    ]),
  ],
};
