import {
  bar,
  beat,
  powerChord,
} from "feature/exercisePlan/data/exerises/tabBuilders";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";

const E5 = powerChord(6, 0);
const A5_OPEN = powerChord(5, 0);
const G5 = powerChord(6, 3);
const A5 = powerChord(6, 5);
const D5 = powerChord(5, 5);

export const powerChordFirstShapesExercise: Exercise = {
  id: "power_chord_first_shapes",
  addedAt: "2026-11-13",
  title: "Power Chords — First Shapes",
  description:
    "Two-note power chords on the low strings: two open shapes, then the movable shape that works on every fret.",
  whyItMatters:
    "The power chord is the building block of rock and metal rhythm guitar. It is one small shape — root and fifth — that you can slide anywhere on the two lowest strings, so learning it once gives you every chord a riff is likely to ask for.",
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Bars 1–2: play the open shapes — the open low string plus fret 2 on the string above it.",
    "Bars 3–4: use the movable shape — index finger on the root, ring finger two frets higher on the next string.",
    "Pick only the two strings of the chord, with a downstroke on every beat.",
    "Let the underside of your index finger rest lightly on the higher strings so they stay silent.",
  ],
  tips: [
    "Keep the hand shape frozen when you move — slide the whole shape instead of rebuilding it.",
    "If the chord buzzes, move your fingers closer to the fret wire rather than pressing harder.",
    "Aim the pick so it stops against the first string you don't want to hear.",
  ],
  metronomeSpeed: { min: 40, max: 120, recommended: 60 },
  relatedSkills: ["chords", "rhythm"],
  tablature: [
    bar([
      beat(1, E5, { chordName: "E5" }),
      beat(1, E5),
      beat(1, E5),
      beat(1, E5),
    ]),
    bar([
      beat(1, A5_OPEN, { chordName: "A5" }),
      beat(1, A5_OPEN),
      beat(1, A5_OPEN),
      beat(1, A5_OPEN),
    ]),
    bar([
      beat(1, G5, { chordName: "G5" }),
      beat(1, G5),
      beat(1, A5, { chordName: "A5" }),
      beat(1, A5),
    ]),
    bar([
      beat(1, D5, { chordName: "D5" }),
      beat(1, D5),
      beat(2, A5, { chordName: "A5" }),
    ]),
  ],
};

const F5 = powerChord(6, 1, 3);
const G5_FULL = powerChord(6, 3, 3);
const A5_FULL = powerChord(6, 5, 3);
const C5 = powerChord(5, 3, 3);
const D5_FULL = powerChord(5, 5, 3);

const eighths = (chord: typeof F5, name: string, count: number) =>
  Array.from({ length: count }, (_, i) =>
    beat(0.5, chord, i === 0 ? { chordName: name } : {}),
  );

export const powerChordShiftsExercise: Exercise = {
  id: "power_chord_shifts",
  addedAt: "2026-11-13",
  title: "Power Chords — Moving the Shape",
  description:
    "Three-note power chords in steady eighth notes, shifting along one string and then across to the next.",
  whyItMatters:
    "Riffs rarely sit on one chord. What makes them sound tight is changing position without a gap in the rhythm — the picking hand keeps its eighth notes going while the fretting hand moves as one block.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Add your pinky under the ring finger for the octave — three strings, one shape.",
    "Play even downstrokes in eighth notes and keep them going through every change.",
    "Bars 1–2: shift along the low E string. Bar 3: the same shape rooted on the A string.",
    "Bar 4: change strings every two eighth notes, then hold the last chord.",
  ],
  tips: [
    "Release the pressure a split second before the shift, but keep your fingers touching the strings.",
    "Look at the fret you are going to, not the one you are leaving.",
    "If the changes are late, slow the click down — do not shorten the last note before a shift.",
  ],
  metronomeSpeed: { min: 50, max: 160, recommended: 80 },
  relatedSkills: ["chords", "rhythm"],
  tablature: [
    bar([...eighths(F5, "F5", 4), ...eighths(G5_FULL, "G5", 4)]),
    bar([...eighths(A5_FULL, "A5", 4), ...eighths(G5_FULL, "G5", 4)]),
    bar([...eighths(C5, "C5", 4), ...eighths(D5_FULL, "D5", 4)]),
    bar([
      ...eighths(G5_FULL, "G5", 2),
      ...eighths(C5, "C5", 2),
      beat(2, D5_FULL, { chordName: "D5" }),
    ]),
  ],
};
