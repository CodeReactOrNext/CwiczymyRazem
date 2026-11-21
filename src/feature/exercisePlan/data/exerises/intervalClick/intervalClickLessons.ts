import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import { ALL_ROOTS, createIntervalClickExercise } from "./createIntervalClickExercise";

// One drill per interval, plus the two "secrets of the neck" drills — the click
// half of the Interval Mastery learning path (feature/journey/data/intervalsJourney).
// Each one is the shared interval-click game narrowed to a single interval, so a
// lesson can teach one shape and then examine exactly that shape.

const ADDED_AT = "2026-11-19";
const WHOLE_NECK = { startFret: 0, endFret: 12 };
/** Every round is played inside a fresh four-fret window, somewhere new on the neck. */
const WINDOW_FRETS = 4;

interface SingleIntervalLesson {
  id: string;
  intervalId: string;
  /** "Minor 2nd" — the title's variant and the name the instructions use. */
  name: string;
  difficulty: Exercise["difficulty"];
  /** Frets up the same string. */
  frets: number;
  /** Where the interval sits one string (or two) higher — the shape worth learning. */
  shape: string;
  /** A second way to find it, or what to watch out for. */
  tip: string;
  whyItMatters: string;
}

function singleIntervalDrill(lesson: SingleIntervalLesson): Exercise {
  return createIntervalClickExercise({
    id: lesson.id,
    addedAt: ADDED_AT,
    title: `Interval Clicks — ${lesson.name}`,
    description: `One interval, a new four-fret window every round: place a root inside it, then click the ${lesson.name.toLowerCase()} above it.`,
    difficulty: lesson.difficulty,
    timeInMinutes: 2,
    region: WHOLE_NECK,
    windowFrets: WINDOW_FRETS,
    intervalIds: [lesson.intervalId],
    rotateSeconds: 45,
    instructions: [
      `A root note appears. Every round asks for the same interval: a ${lesson.name.toLowerCase()} above it.`,
      "Every round lights up a different four-fret window. Only the cells inside it count.",
      "Step 1: click ONE spot where the root lives inside that window.",
      `Step 2: click the ${lesson.name.toLowerCase()} measured from that exact spot, still inside the window.`,
      "The answer's name stays hidden until you find it. You're learning a shape, not a list of note names.",
    ],
    tips: [
      `On one string it is ${lesson.frets} ${lesson.frets === 1 ? "fret" : "frets"} up.`,
      lesson.shape,
      lesson.tip,
    ],
    whyItMatters: lesson.whyItMatters,
  });
}

export const intervalClickMinor2ndExercise = singleIntervalDrill({
  id: "interval_click_minor_2nd",
  intervalId: "m2",
  name: "Minor 2nd",
  difficulty: "easy",
  frets: 1,
  shape: "One string higher it sits four frets back, a stretch you'll rarely use. Think of this one along the string.",
  tip: "Any two neighbouring frets are a minor 2nd apart. That's the whole shape.",
  whyItMatters:
    "The half step is the unit every other interval is counted in. It is also the sound of tension itself: a half-step bend, the note leaning into a chord tone, the two notes of a film-score shark.",
});

export const intervalClickMajor2ndExercise = singleIntervalDrill({
  id: "interval_click_major_2nd",
  intervalId: "M2",
  name: "Major 2nd",
  difficulty: "easy",
  frets: 2,
  shape: "One string higher it sits three frets back: index on the higher string, pinky on the root.",
  tip: "Skip one fret and you have it. Most neighbouring scale notes are this far apart.",
  whyItMatters:
    "The whole step is what scales are mostly made of, and the size of a full bend. Seeing it instantly is what makes scale shapes stop looking like dot patterns.",
});

export const intervalClickMinor3rdExercise = singleIntervalDrill({
  id: "interval_click_minor_3rd",
  intervalId: "m3",
  name: "Minor 3rd",
  difficulty: "easy",
  frets: 3,
  shape: "One string higher it sits two frets back. Crossing from the G string to the B string, only one fret back.",
  tip: "It is the first two notes of the minor pentatonic box: index finger, then pinky on the same string.",
  whyItMatters:
    "The minor 3rd is what makes a minor chord minor. Find it from any root and you can turn any note into a minor chord, a minor lick or the start of a pentatonic box.",
});

export const intervalClickMajor3rdExercise = singleIntervalDrill({
  id: "interval_click_major_3rd",
  intervalId: "M3",
  name: "Major 3rd",
  difficulty: "easy",
  frets: 4,
  shape: "One string higher it sits one fret back. From the G string to the B string it is the very same fret.",
  tip: "Find the minor 3rd first if you get lost, then move one fret up. That one fret is the whole difference between minor and major.",
  whyItMatters:
    "The major 3rd is what makes a major chord major. It sits one fret away from the minor 3rd, so knowing exactly where both live is knowing where every chord gets its mood.",
});

export const intervalClickPerfect4thExercise = singleIntervalDrill({
  id: "interval_click_perfect_4th",
  intervalId: "P4",
  name: "Perfect 4th",
  difficulty: "easy",
  frets: 5,
  shape: "One string higher, same fret. From the G string to the B string, one fret up.",
  tip: "Lay one finger flat across two neighbouring strings and you are playing a 4th.",
  whyItMatters:
    "Your guitar is tuned in 4ths, so this is the interval the whole neck is built from. Every shape you'll ever learn is a consequence of it.",
});

export const intervalClickTritoneExercise = singleIntervalDrill({
  id: "interval_click_tritone",
  intervalId: "TT",
  name: "Tritone",
  difficulty: "medium",
  frets: 6,
  shape: "One string higher, one fret up: the power chord shape with its top note pulled back a fret.",
  tip: "It sits between the 4th and the 5th. Find either one and step a single fret toward the other.",
  whyItMatters:
    "The tritone is the unstable note inside every dominant 7th chord and the flat 5 of the blues scale. Knowing where it sits is knowing where the tension is.",
});

export const intervalClickPerfect5thExercise = singleIntervalDrill({
  id: "interval_click_perfect_5th",
  intervalId: "P5",
  name: "Perfect 5th",
  difficulty: "easy",
  frets: 7,
  shape: "One string higher, two frets up: the power chord. From the G string to the B string, three frets up.",
  tip: "If you can play a power chord, your index and ring finger already know this shape.",
  whyItMatters:
    "The 5th is the backbone of every power chord, every barre chord and most bass lines. It is the first interval worth being able to grab without looking.",
});

export const intervalClickMinor6thExercise = singleIntervalDrill({
  id: "interval_click_minor_6th",
  intervalId: "m6",
  name: "Minor 6th",
  difficulty: "medium",
  frets: 8,
  shape: "Two strings higher, two frets back. Or one string higher, three frets up.",
  tip: "It is one fret above the 5th. Find the power chord shape and push its top note up a fret.",
  whyItMatters:
    "The minor 6th is the dark colour of the natural minor scale and the note that separates it from Dorian. On the neck it is a major 3rd turned upside down.",
});

export const intervalClickMajor6thExercise = singleIntervalDrill({
  id: "interval_click_major_6th",
  intervalId: "M6",
  name: "Major 6th",
  difficulty: "medium",
  frets: 9,
  shape: "Two strings higher, one fret back. Crossing the G–B pair, the same fret.",
  tip: "Skip a string and lean back one fret. This is the double-stop shape behind soul and country fills.",
  whyItMatters:
    "Sixths are the sweet harmony behind soul, country and blues fills, and the note that makes Dorian sound brighter than plain minor.",
});

export const intervalClickMinor7thExercise = singleIntervalDrill({
  id: "interval_click_minor_7th",
  intervalId: "m7",
  name: "Minor 7th",
  difficulty: "medium",
  frets: 10,
  shape: "Two strings higher, same fret. Crossing the G–B pair, one fret up.",
  tip: "It sits two frets below the octave. Find the octave shape and come back two frets.",
  whyItMatters:
    "The minor 7th turns a plain chord into a 7th chord. It is in every blues, every funk vamp and every minor pentatonic box you've played.",
});

export const intervalClickMajor7thExercise = singleIntervalDrill({
  id: "interval_click_major_7th",
  intervalId: "M7",
  name: "Major 7th",
  difficulty: "medium",
  frets: 11,
  shape: "Two strings higher, one fret up. Crossing the G–B pair, two frets up.",
  tip: "It sits one fret below the octave. Find the octave shape and come back a single fret.",
  whyItMatters:
    "The major 7th is the dreamy note of maj7 chords and the leading tone that pulls a melody home. One fret below the octave, and impossible to mistake once you know it.",
});

export const intervalClickInversionPairsExercise = createIntervalClickExercise({
  id: "interval_click_inversion_pairs",
  addedAt: ADDED_AT,
  title: "Interval Clicks — Inversion Pairs",
  description: "Thirds and sixths, fourths and fifths: the pairs that turn into each other when you flip them.",
  difficulty: "medium",
  timeInMinutes: 3,
  region: WHOLE_NECK,
  windowFrets: WINDOW_FRETS,
  intervalIds: ["m3", "M6", "M3", "m6", "P4", "P5"],
  roots: ALL_ROOTS,
  rotateSeconds: 45,
  instructions: [
    "A root and an interval appear. Only six intervals are in play, and they come in three pairs: minor 3rd and major 6th, major 3rd and minor 6th, 4th and 5th.",
    "Each round is confined to a different four-fret window. Step 1: click one spot of the root inside it. Step 2: click the interval measured from it.",
    "After each round, look at the two notes and name the pair's other half: the same two notes read from the top down.",
  ],
  tips: [
    "The two halves of a pair always add up to nine: 3rd and 6th, 4th and 5th.",
    "Flipping swaps major and minor. A major 3rd flips into a minor 6th.",
    "Perfect stays perfect: a 4th flips into a 5th and back.",
  ],
  whyItMatters:
    "Once the pairs are linked in your head, six shapes become three. A 6th stops being a new thing to learn and becomes a 3rd you already know, seen from the other side.",
});

export const intervalClickGBCrossingExercise = createIntervalClickExercise({
  id: "interval_click_g_b_crossing",
  addedAt: ADDED_AT,
  title: "Interval Clicks — G to B Crossing",
  description: "Only the G and B strings are in play: the one pair where every shape sits a fret higher than you expect.",
  difficulty: "medium",
  timeInMinutes: 3,
  region: WHOLE_NECK,
  windowFrets: WINDOW_FRETS,
  strings: [3, 2],
  intervalIds: ["m3", "M3", "P4", "TT", "P5"],
  rotateSeconds: 45,
  instructions: [
    "Only the G and B strings are live. A root and an interval appear.",
    "Each round lights up a different four-fret window on those two strings. Step 1: place the root inside it, on the G string when you can, so the answer has to cross to the B string.",
    "Step 2: click the interval. Every shape you know from the other strings lands one fret higher here.",
  ],
  tips: [
    "Across this pair the 4th is one fret up instead of the same fret.",
    "The major 3rd is the same fret here, which is exactly how the two strings are tuned.",
    "The power chord's 5th is three frets up instead of two.",
  ],
  whyItMatters:
    "Most wrong notes in the upper strings come from carrying a low-string shape across the G–B pair unchanged. Drilling just this crossing is the fastest way to stop a shape from breaking where the tuning does.",
});

export const intervalClickLessonExercises: Exercise[] = [
  intervalClickMinor2ndExercise,
  intervalClickMajor2ndExercise,
  intervalClickMinor3rdExercise,
  intervalClickMajor3rdExercise,
  intervalClickPerfect4thExercise,
  intervalClickTritoneExercise,
  intervalClickPerfect5thExercise,
  intervalClickMinor6thExercise,
  intervalClickMajor6thExercise,
  intervalClickMinor7thExercise,
  intervalClickMajor7thExercise,
  intervalClickInversionPairsExercise,
  intervalClickGBCrossingExercise,
];
