import {
  bar,
  beat,
  note,
} from "feature/exercisePlan/data/exerises/tabBuilders";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";

/**
 * Thirds of the G major scale on the top two strings: the scale note on the B
 * string with the note a third above it on the high E string.
 */
const THIRDS: Record<string, [number, number]> = {
  D: [3, 2],
  E: [5, 3],
  "F#": [7, 5],
  G: [8, 7],
  A: [10, 8],
  B: [12, 10],
};

const third = (name: keyof typeof THIRDS, duration: number) => {
  const [bFret, eFret] = THIRDS[name];
  return beat(duration, [note(2, bFret), note(1, eFret)]);
};

export const doubleStopsThirdsExercise: Exercise = {
  id: "double_stops_thirds_g_major",
  addedAt: "2026-11-13",
  title: "Double Stops — Thirds in G Major",
  description:
    "Walk the G major scale in thirds on the top two strings — two notes at a time, up the neck and back.",
  whyItMatters:
    "Harmonised thirds are the sound of country fills, soul guitar and twin-lead rock melodies. Playing a scale as pairs also shows you which thirds are major and which are minor — the two shapes that every chord is built from.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Play both strings together with one downstroke — the two notes must sound as one.",
    "There are only two shapes: one fret apart (major third) and two frets apart (minor third).",
    "Bars 1–2: climb in quarter notes. Bars 3–4: come back down with some eighth notes.",
    "Slide the hand along the strings between pairs instead of lifting it off.",
  ],
  tips: [
    "Use index and middle for the one-fret shape, index and ring for the two-fret shape.",
    "Mute the G string with the tip of the finger on the B string, so a wide strum stays clean.",
    "Name each shape as you play it — major or minor — to tie the sound to the look.",
  ],
  metronomeSpeed: { min: 40, max: 130, recommended: 70 },
  relatedSkills: ["harmony", "chords", "phrasing"],
  tablature: [
    bar([third("D", 1), third("E", 1), third("F#", 1), third("G", 1)]),
    bar([third("A", 1), third("B", 1), third("A", 1), third("G", 1)]),
    bar([
      third("G", 0.5),
      third("F#", 0.5),
      third("E", 0.5),
      third("F#", 0.5),
      third("G", 0.5),
      third("A", 0.5),
      third("G", 1),
    ]),
    bar([third("F#", 1), third("E", 1), third("D", 1), third("G", 1)]),
  ],
};

/**
 * An octave shape: the root, the same note two strings higher and two frets up,
 * and the string in between muted by the fretting finger.
 */
const octave = (rootString: number, fret: number, duration: number) =>
  beat(duration, [
    note(rootString, fret),
    note(rootString - 1, fret, { isDead: true }),
    note(rootString - 2, fret + 2),
  ]);

export const octaveShapesExercise: Exercise = {
  id: "octave_shapes_muted_lines",
  addedAt: "2026-11-13",
  title: "Octaves — Muted Octave Lines",
  description:
    "Play a melody in octaves: two notes an octave apart with the string between them muted, strummed as one.",
  whyItMatters:
    "Octave lines make a single-note melody sound twice as big, which is why they turn up everywhere from jazz to punk to modern metal. The technique is mostly muting: every string except the two you want has to stay dead under a full strum.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Index finger on the lower note, ring or pinky on the upper note two frets higher and two strings over.",
    "Let the index finger lean against the string in between so it gives a dead click, not a note.",
    "Strum through all three strings with one loose downstroke.",
    "Bars 1–2: roots on the A string. Bars 3–4: the same shape rooted on the low E string.",
  ],
  tips: [
    "Lay the index finger flat enough to mute the higher strings too — then you can strum without aiming.",
    "Keep the shape locked and move from the elbow.",
    "If the middle string rings, flatten the index finger; if the low note buzzes, arch it a little more.",
  ],
  metronomeSpeed: { min: 50, max: 150, recommended: 80 },
  relatedSkills: ["articulation", "phrasing"],
  tablature: [
    bar([octave(5, 5, 1), octave(5, 7, 1), octave(5, 10, 1), octave(5, 7, 1)]),
    bar([
      octave(5, 5, 0.5),
      octave(5, 5, 0.5),
      octave(5, 7, 0.5),
      octave(5, 7, 0.5),
      octave(5, 10, 0.5),
      octave(5, 10, 0.5),
      octave(5, 7, 0.5),
      octave(5, 7, 0.5),
    ]),
    bar([octave(6, 5, 1), octave(6, 8, 1), octave(6, 10, 1), octave(6, 8, 1)]),
    bar([
      octave(5, 7, 0.5),
      octave(5, 5, 0.5),
      octave(5, 3, 1),
      octave(6, 5, 2),
    ]),
  ],
};

/**
 * Sixths of the G major scale: the scale note on the G string with the note a
 * sixth above it on the high E string. The B string in between stays silent.
 */
const SIXTHS: Record<string, [number, number]> = {
  B: [4, 3],
  C: [5, 5],
  D: [7, 7],
  E: [9, 8],
  "F#": [11, 10],
  G: [12, 12],
};

const sixth = (name: string, duration: number) => {
  const [gFret, eFret] = SIXTHS[name];
  return beat(duration, [note(3, gFret), note(1, eFret)]);
};

export const doubleStopsSixthsExercise: Exercise = {
  id: "double_stops_sixths_g_major",
  addedAt: "2026-11-13",
  title: "Double Stops — Sixths in G Major",
  description:
    "The G major scale in sixths on the G and high E strings, with the B string between them kept silent.",
  whyItMatters:
    "Sixths are the wide, sweet interval behind soul intros, country bends and slow blues fills. Because the two notes sit on non-adjacent strings, they also teach you to play two strings while muting the one in the middle.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Play the G string with the pick and the high E string with your middle or ring finger at the same time.",
    "Or use the pick alone and mute the B string with the underside of the finger fretting the G string.",
    "There are two shapes: both notes on the same fret, or the high note one fret lower.",
    "Bars 1–2 climb in quarter notes; bars 3–4 come back with some eighth notes.",
  ],
  tips: [
    "Slide between neighbouring shapes instead of lifting the fingers — sixths love slides.",
    "Keep both notes the same volume; the plucked string tends to be quieter.",
    "Listen for the B string. If it rings, the mute has slipped.",
  ],
  metronomeSpeed: { min: 40, max: 130, recommended: 70 },
  relatedSkills: ["harmony", "hybrid_picking", "phrasing"],
  tablature: [
    bar([sixth("B", 1), sixth("C", 1), sixth("D", 1), sixth("E", 1)]),
    bar([sixth("F#", 1), sixth("G", 1), sixth("F#", 1), sixth("E", 1)]),
    bar([
      sixth("D", 0.5),
      sixth("E", 0.5),
      sixth("D", 0.5),
      sixth("C", 0.5),
      sixth("B", 0.5),
      sixth("C", 0.5),
      sixth("D", 1),
    ]),
    bar([sixth("C", 1), sixth("B", 1), sixth("D", 2)]),
  ],
};

/** Two notes on the same fret of the D and G strings — a perfect fourth. */
const fourth = (fret: number, duration: number) =>
  beat(duration, [note(4, fret), note(3, fret)]);

export const doubleStopsRockFourthsExercise: Exercise = {
  id: "double_stops_rock_fourths",
  addedAt: "2026-11-13",
  title: "Double Stops — Rock Fourths",
  description:
    "A riff in parallel fourths: one finger laid across the D and G strings, moved up and down the neck.",
  whyItMatters:
    "Two notes a fourth apart are a power chord turned upside down — thinner, brighter and easy to move fast. One finger on two strings is all it takes, which is why riffs in fourths are among the first things rock guitarists learn.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Flatten one fingertip across the D and G strings on the same fret.",
    "Pick both strings together with a downstroke and nothing else.",
    "Use the index finger on frets 5 and 7, and the ring finger on frets 9, 10 and 12.",
    "Follow the rhythm exactly: two eighth notes, then quarter notes.",
  ],
  tips: [
    "Rest the fingertip against the A string to mute it, and let the finger's underside mute the B string.",
    "Both notes must sound equally — roll the finger until neither is choked.",
    "Add a little palm muting on the eighth notes to make the riff bounce.",
  ],
  metronomeSpeed: { min: 50, max: 150, recommended: 80 },
  relatedSkills: ["rhythm", "articulation"],
  tablature: [
    bar([fourth(7, 0.5), fourth(7, 0.5), fourth(5, 1), fourth(7, 1), fourth(10, 1)]),
    bar([fourth(9, 0.5), fourth(9, 0.5), fourth(7, 1), fourth(5, 2)]),
    bar([fourth(7, 0.5), fourth(7, 0.5), fourth(10, 1), fourth(12, 1), fourth(10, 1)]),
    bar([fourth(9, 1), fourth(7, 1), fourth(7, 2)]),
  ],
};
