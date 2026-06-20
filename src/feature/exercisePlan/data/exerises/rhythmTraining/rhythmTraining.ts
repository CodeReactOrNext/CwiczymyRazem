import type { Exercise, TablatureBeat, TablatureMeasure } from "feature/exercisePlan/types/exercise.types";

type Difficulty = "easy" | "medium" | "hard";

// ── Rhythm generator ─────────────────────────────────────────────────────────
// Each exercise's tablature is generated from small one/two/three-beat rhythmic
// "cells" picked at random and packed into 4/4 measures. The result stays fixed
// for a whole session (pausing never changes it) and is re-rolled only when the
// exercise is entered or restarted, via rerollCustomGoal() — same pattern as
// randomNoteHunt. See PracticeSession.

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// A single muted note on the low E string (matches the original exercise).
const note = (duration: number): TablatureBeat => ({
  duration,
  notes: [{ string: 6, fret: 0 }],
});
const rest = (duration: number): TablatureBeat => ({ duration, notes: [] });

/** A rhythmic building block that fills exactly `beats` quarter-note beats. */
interface Cell {
  beats: number;
  make: () => TablatureBeat[];
}

// Pools are weighted simply by repeating an entry to make it more likely.
const CELL_POOLS: Record<Difficulty, Cell[]> = {
  easy: [
    { beats: 1, make: () => [note(1)] },                 // quarter
    { beats: 1, make: () => [note(1)] },                 // quarter (weighted)
    { beats: 1, make: () => [rest(1)] },                 // quarter rest
    { beats: 1, make: () => [note(0.5), note(0.5)] },    // two eighths
    { beats: 2, make: () => [note(2)] },                 // half
    { beats: 2, make: () => [note(2)] },                 // half (weighted)
    { beats: 3, make: () => [note(3)] },                 // dotted half
  ],
  medium: [
    { beats: 1, make: () => [note(1)] },                       // quarter
    { beats: 1, make: () => [note(0.5), note(0.5)] },          // two eighths
    { beats: 1, make: () => [note(0.5), note(0.5)] },          // two eighths (weighted)
    { beats: 1, make: () => [rest(0.5), note(0.5)] },          // off-beat eighth
    { beats: 1, make: () => [note(0.5), rest(0.5)] },          // eighth + rest
    { beats: 1, make: () => [rest(1)] },                       // quarter rest
    { beats: 2, make: () => [note(1.5), note(0.5)] },          // dotted quarter + eighth
  ],
  hard: [
    { beats: 1, make: () => [note(0.25), note(0.25), note(0.25), note(0.25)] }, // four 16ths
    { beats: 1, make: () => [note(0.5), note(0.25), note(0.25)] },              // gallop
    { beats: 1, make: () => [note(0.25), note(0.25), note(0.5)] },              // reverse gallop
    { beats: 1, make: () => [rest(0.25), note(0.25), rest(0.25), note(0.25)] }, // 16th syncopation
    { beats: 1, make: () => [note(0.333), note(0.333), note(0.333)] },          // triplet
    { beats: 1, make: () => [note(0.5), note(0.5)] },                           // two eighths
  ],
};

/** Builds one 4/4 measure by packing random cells until the bar is full, then
 *  accents the first sounding note of each cell to mark the pulse. */
const generateMeasure = (difficulty: Difficulty): TablatureMeasure => {
  const pool = CELL_POOLS[difficulty];
  const beats: TablatureBeat[] = [];
  let remaining = 4;

  while (remaining > 0) {
    const cell = pick(pool.filter((c) => c.beats <= remaining));
    const cellBeats = cell.make();
    // Accent the first sounding (non-rest) note in this beat group.
    const firstNote = cellBeats.find((b) => b.notes.length > 0);
    if (firstNote) firstNote.notes = firstNote.notes.map((n) => ({ ...n, isAccented: true }));
    beats.push(...cellBeats);
    remaining -= cell.beats;
  }

  return { timeSignature: [4, 4], beats };
};

const generateTablature = (difficulty: Difficulty, measureCount = 5): TablatureMeasure[] =>
  Array.from({ length: measureCount }, () => generateMeasure(difficulty));

let easyTablature = generateTablature("easy");
let mediumTablature = generateTablature("medium");
let hardTablature = generateTablature("hard");

// ─────────────────────────────────────────────────────────────────────────────

export const rhythmTrainingEasy: Exercise = {
  id: "rhythm_training_easy",
  title: "Rhythm Training — Easy",
  description: "Execute fundamental quarter and half-note rhythms on a muted string to establish a solid internal pulse.",
  whyItMatters: "This exercise strips away all melodic and harmonic distractions, forcing you to focus entirely on rhythmic precision. Developing a strong quarter-note pulse is the foundational prerequisite for all complex strumming and lead playing.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Rest your fretting hand lightly on one string so it's muted and produces only a percussive click, no clear pitch.",
    "Pick that muted string on each note shown, holding quarter and half notes for their full length.",
    "On rests, stop picking and let the silence last exactly as long as it should."
  ],
  tips: [
    "Count aloud '1 - 2 - 3 - 4' with the metronome so every note lands exactly on the beat.",
    "Keep the accented first note of each group a touch louder to feel the pulse.",
    "Don't rush out of the rests — a held note or a silence is still part of the rhythm."
  ],
  metronomeSpeed: { min: 50, max: 85, recommended: 65 },
  relatedSkills: ["rhythm"],
  get tablature() {
    return easyTablature;
  },
  rerollCustomGoal: () => { easyTablature = generateTablature("easy"); },
};

export const rhythmTrainingMedium: Exercise = {
  id: "rhythm_training_medium",
  title: "Rhythm Training — Medium",
  description: "Perform eighth-note subdivisions and basic syncopated patterns on a muted string.",
  whyItMatters: "This exercise develops your ability to accurately divide the beat and execute off-beat rhythms. Mastering eighth-note syncopation provides the rhythmic vocabulary necessary for standard pop, rock, and funk guitar parts.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Mute a single string with your fretting hand.",
    "Maintain a continuous down-up motion with your picking hand for all eighth notes.",
    "Accent the syncopated off-beats by striking the string slightly harder on the upstrokes.",
  ],
  tips: [
    "Count aloud using '1 & 2 & 3 & 4 &' to lock the subdivisions into the metronome pulse.",
    "Keep your foot tapping strictly on the quarter-note downbeats, even during heavily syncopated phrases.",
    "Treat rests as active musical elements—your hand should still swing silently through the air.",
  ],
  metronomeSpeed: { min: 40, max: 115, recommended: 85 },
  relatedSkills: ["rhythm"],
  get tablature() {
    return mediumTablature;
  },
  rerollCustomGoal: () => { mediumTablature = generateTablature("medium"); },
};

export const rhythmTrainingHard: Exercise = {
  id: "rhythm_training_hard",
  title: "Rhythm Training — Hard",
  description: "Execute complex sixteenth-note subdivisions, triplets, and polyrhythmic groupings on a muted string.",
  whyItMatters: "This exercise challenges your fine motor control and deep rhythmic grid. Navigating rapid sixteenths, shifting to triplet feels, and executing 3-over-4 polyrhythms trains ultimate rhythmic independence and strict metronomic alignment.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Mute a single string and execute precise rapid subdivisions using strict alternate picking.",
    "For sixteenth notes, maintain an uninterrupted down-up-down-up sequence.",
    "For the polyrhythmic measure, accent every third sixteenth note while maintaining the steady 4/4 grid.",
  ],
  tips: [
    "Count sixteenth notes aloud using '1 e & a, 2 e & a'.",
    "For triplets, mentally divide the beat into three equal parts ('1 & a, 2 & a').",
    "If you drift off the grid during the polyrhythm, stop, reset your internal pulse with the metronome, and start the measure over.",
  ],
  metronomeSpeed: { min: 40, max: 135, recommended: 95 },
  relatedSkills: ["rhythm"],
  get tablature() {
    return hardTablature;
  },
  rerollCustomGoal: () => { hardTablature = generateTablature("hard"); },
};
