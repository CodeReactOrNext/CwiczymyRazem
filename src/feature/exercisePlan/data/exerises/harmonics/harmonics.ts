import {
  bar,
  beat,
  note,
} from "feature/exercisePlan/data/exerises/tabBuilders";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";

/** Open strings in standard tuning, string 1 (high E) first. */
const OPEN_MIDI = [64, 59, 55, 50, 45, 40];

/** Semitones above the open string a natural harmonic sounds at, by fret. */
const HARMONIC_SEMITONES: Record<number, number> = { 12: 12, 7: 19, 5: 24 };

/**
 * A natural harmonic. The tab shows the fret the finger touches, but the pitch
 * that sounds is not that fret's — at frets 7 and 5 it is far above it — so the
 * real pitch goes in `midiNote` for the mic to listen for.
 */
const harmonic = (string: number, fret: number) =>
  note(string, fret, {
    harmonicType: 1,
    isLetRing: true,
    midiNote: OPEN_MIDI[string - 1] + HARMONIC_SEMITONES[fret],
  });

export const naturalHarmonicsExercise: Exercise = {
  id: "natural_harmonics_12_7_5",
  addedAt: "2026-11-13",
  title: "Harmonics — Natural 12, 7 and 5",
  description:
    "Ring out natural harmonics at the three places they speak most easily: the 12th, 7th and 5th frets.",
  whyItMatters:
    "Natural harmonics are the bell-like notes in intros and clean passages, and the quickest way to check your tuning by ear. They also teach a light, exact fretting-hand touch that nothing else on the guitar asks for.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Touch the string directly above the metal fret wire — do not press it down to the fretboard.",
    "Pick, then lift the finger straight away so the harmonic keeps ringing.",
    "Bars 1–2: the 12th fret on every string. Bar 3: the 7th fret. Bar 4: the 5th fret, then all three in a row.",
    "Let each harmonic ring into the next one.",
  ],
  tips: [
    "Pick closer to the bridge than usual — harmonics come out brighter and louder there.",
    "The 5th-fret harmonics are the quietest. If they will not sound, move the finger a hair towards the nut.",
    "The bridge pickup and a little gain make every harmonic easier to hear.",
  ],
  metronomeSpeed: { min: 40, max: 100, recommended: 60 },
  relatedSkills: ["articulation"],
  tablature: [
    bar([
      beat(1, harmonic(6, 12)),
      beat(1, harmonic(5, 12)),
      beat(1, harmonic(4, 12)),
      beat(1, harmonic(3, 12)),
    ]),
    bar([
      beat(1, harmonic(2, 12)),
      beat(1, harmonic(1, 12)),
      beat(2, harmonic(2, 12)),
    ]),
    bar([
      beat(1, harmonic(6, 7)),
      beat(1, harmonic(5, 7)),
      beat(1, harmonic(4, 7)),
      beat(1, harmonic(3, 7)),
    ]),
    bar([
      beat(1, harmonic(4, 5)),
      beat(1, harmonic(3, 5)),
      beat(1, harmonic(3, 7)),
      beat(1, harmonic(3, 12)),
    ]),
  ],
};

export const pinchHarmonicsExercise: Exercise = {
  id: "pinch_harmonics_squeals",
  addedAt: "2026-11-13",
  title: "Harmonics — Pinch Squeals",
  description:
    "Find the pinch harmonic: the thumb brushes the string right after the pick, turning a fretted note into a scream.",
  whyItMatters:
    "The pinch harmonic is the signature squeal of rock and metal lead playing. It is entirely a picking-hand skill, and it lives in a few millimetres of string — which is why it takes a session of hunting before it becomes something you can do on demand.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 2.5,
  instructions: [
    "Use the bridge pickup with plenty of gain — pinch harmonics barely exist on a clean sound.",
    "Choke up on the pick until only a sliver of the tip shows past your thumb.",
    "Fret the G string at the 7th fret and pick down so the side of your thumb grazes the string a moment after the pick.",
    "Move the picking hand slowly between the neck pickup and the bridge, picking as you go, and listen for the spots where the note jumps up.",
    "When you find a spot that squeals, repeat it ten times, then add vibrato with the fretting hand.",
    "Repeat on the D and A strings, then on other frets — the sweet spots move with the fretted note.",
  ],
  tips: [
    "Think of it as one motion — pick and thumb together — not two separate touches.",
    "Different spots give different pitches. That is normal: you are choosing which overtone to bring out.",
    "Wide vibrato or a bend makes a pinch harmonic sing much longer.",
    "If nothing comes out, turn the pick so more of its edge, not its flat face, meets the string.",
  ],
  disableMic: true,
  metronomeSpeed: null,
  relatedSkills: ["articulation", "vibrato"],
};

export const harmonicsChimeMelodyExercise: Exercise = {
  id: "harmonics_chime_melody",
  addedAt: "2026-11-13",
  title: "Harmonics — Chime Melody",
  description:
    "A melody made only of natural harmonics on the D, G and B strings, moving between the 12th, 7th and 5th frets.",
  whyItMatters:
    "The harmonics on the middle three strings spell out complete chords — G at the 12th and 5th frets, D at the 7th. Moving between them in time turns a party trick into something you can use in an intro or an ending.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Lay one finger lightly across the D, G and B strings, directly above the fret wire.",
    "Pick the strings one at a time and let them ring into each other.",
    "Bar 1: the 12th fret. Bar 2: the 7th fret. Bar 3: the 5th fret. Bar 4: back to the 12th.",
    "Move the hand during the last note of each bar — the ringing harmonics cover the shift.",
  ],
  tips: [
    "Lift the finger right after each pick stroke so the harmonics keep sounding.",
    "The 5th-fret harmonics need a firmer pick attack close to the bridge.",
    "Glance ahead to the next fret before you move; a harmonic touched a few millimetres off will not speak.",
  ],
  metronomeSpeed: { min: 40, max: 110, recommended: 60 },
  relatedSkills: ["articulation", "phrasing"],
  tablature: [
    ...[12, 7, 5].map((fret) =>
      bar([
        beat(1, harmonic(4, fret)),
        beat(1, harmonic(3, fret)),
        beat(1, harmonic(2, fret)),
        beat(1, harmonic(3, fret)),
      ]),
    ),
    bar([
      beat(1, harmonic(2, 12)),
      beat(1, harmonic(3, 12)),
      beat(2, harmonic(4, 12)),
    ]),
  ],
};
