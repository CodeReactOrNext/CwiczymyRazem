import {
  bar,
  beat,
  note,
} from "feature/exercisePlan/data/exerises/tabBuilders";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";

const ring = (string: number, fret: number) => note(string, fret, { isLetRing: true });

/**
 * One chord for the picking hand: two bass strings the thumb alternates
 * between, and the two treble strings the index and middle fingers play.
 */
interface Pattern {
  name: string;
  bass: [number, number];
  alternate: [number, number];
  index: [number, number];
  middle: [number, number];
}

const C: Pattern = { name: "C", bass: [5, 3], alternate: [4, 2], index: [3, 0], middle: [2, 1] };
const G: Pattern = { name: "G", bass: [6, 3], alternate: [4, 0], index: [3, 0], middle: [2, 0] };
const A_MINOR: Pattern = { name: "Am", bass: [5, 0], alternate: [4, 2], index: [3, 2], middle: [2, 1] };

/** Thumb on the beats, a finger on every off-beat. */
const thumbAndFingers = (p: Pattern) =>
  bar([
    beat(0.5, ring(...p.bass), { chordName: p.name }),
    beat(0.5, ring(...p.index)),
    beat(0.5, ring(...p.alternate)),
    beat(0.5, ring(...p.middle)),
    beat(0.5, ring(...p.bass)),
    beat(0.5, ring(...p.index)),
    beat(0.5, ring(...p.alternate)),
    beat(0.5, ring(...p.middle)),
  ]);

export const fingerstyleAlternatingThumbExercise: Exercise = {
  id: "fingerstyle_alternating_thumb",
  addedAt: "2026-11-13",
  title: "Fingerstyle — Alternating Thumb",
  description:
    "The thumb rocks between two bass strings on every beat while the fingers fill in the off-beats, over C, G and A minor.",
  whyItMatters:
    "A steady alternating thumb is the engine of fingerstyle guitar — folk, country blues, Travis picking all sit on it. Once the thumb keeps time on its own, the fingers are free to play melody over the top.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 2,
  instructions: [
    "Hold each chord for its whole bar and let every note ring.",
    "Bar 1: thumb only — two bass strings, one note per beat.",
    "From bar 2: keep the thumb exactly as it was and add the index finger on the G string and the middle finger on the B string between the beats.",
    "Thumb plays downwards, fingers pluck upwards into the palm.",
  ],
  tips: [
    "Practise the thumb alone until you can talk while doing it — it has to run without attention.",
    "Rest the heel of the hand lightly near the bridge if the hand feels like it is floating.",
    "Keep the fingers curled and close to their strings; big motions are what make the rhythm uneven.",
  ],
  metronomeSpeed: { min: 40, max: 130, recommended: 60 },
  relatedSkills: ["hybrid_picking", "rhythm", "chords"],
  tablature: [
    bar([
      beat(1, ring(...C.bass), { chordName: "C" }),
      beat(1, ring(...C.alternate)),
      beat(1, ring(...C.bass)),
      beat(1, ring(...C.alternate)),
    ]),
    thumbAndFingers(C),
    thumbAndFingers(G),
    thumbAndFingers(A_MINOR),
  ],
};

/** The Travis pattern: thumb and middle finger pinch on beat one, then the roll. */
const travis = (p: Pattern) =>
  bar([
    beat(1, [ring(...p.bass), ring(...p.middle)], { chordName: p.name }),
    beat(0.5, ring(...p.alternate)),
    beat(0.5, ring(...p.index)),
    beat(0.5, ring(...p.bass)),
    beat(0.5, ring(...p.middle)),
    beat(0.5, ring(...p.alternate)),
    beat(0.5, ring(...p.index)),
  ]);

export const fingerstyleTravisPinchExercise: Exercise = {
  id: "fingerstyle_travis_pinch",
  addedAt: "2026-11-13",
  title: "Fingerstyle — Travis Pinch Pattern",
  description:
    "The classic Travis pattern: a pinch of bass and treble on beat one, then the thumb keeps alternating while the fingers roll between its notes.",
  whyItMatters:
    "This one pattern accompanies hundreds of songs. The pinch on beat one is the first step towards real independence — two fingers moving in opposite directions at the same instant while the thumb never breaks its pulse.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 2,
  instructions: [
    "Beat 1: pluck the bass note with the thumb and the B string with the middle finger at exactly the same moment.",
    "Then the thumb carries on alternating between its two bass strings on every beat.",
    "The index finger (G string) and middle finger (B string) fall between the thumb's notes.",
    "Play one bar on each chord: C, A minor, G, and back to C.",
  ],
  tips: [
    "Learn it on C alone until you no longer have to count, then add the chord changes.",
    "The pinch should sound like one event — if you hear two notes, slow down.",
    "Change chords on the last eighth note if you need the time; the open G string covers the gap.",
  ],
  metronomeSpeed: { min: 40, max: 140, recommended: 60 },
  relatedSkills: ["hybrid_picking", "rhythm", "chords"],
  tablature: [travis(C), travis(A_MINOR), travis(G), travis(C)],
};
