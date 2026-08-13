import { getNotePositionsInRange } from "feature/exercisePlan/scales/fretboardMapper";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

const START_FRET = 6;
const END_FRET = 12;
const STRINGS = [6];

// Only 7 of the 12 chromatic notes actually fall inside a 7-fret single-string
// window — picking from the full NOTES array would sometimes ask for a note
// that has no valid position to click at all.
const VALID_NOTES = NOTES.filter(
  (note) => getNotePositionsInRange(NOTES.indexOf(note), START_FRET, END_FRET).some((p) => STRINGS.includes(p.string)),
);

const pickNote = (exclude?: string): string => {
  const pool = exclude ? VALID_NOTES.filter((n) => n !== exclude) : VALID_NOTES;
  return pool[Math.floor(Math.random() * pool.length)];
};

let currentTarget = pickNote();

export const fretClickLowEHighExercise: Exercise = {
  id: "fret_click_low_e_high",
  addedAt: "2026-08-03",
  isHiddenFromLanding: true,
  title: "Click Hunt — Low E, Frets 6–12",
  description: "A note name appears — click its spot on the low E string, frets 6 to 12.",
  difficulty: "beginner",
  category: "theory",
  timeInMinutes: 1.3,
  instructions: [
    "A target note appears above the fretboard diagram.",
    "Click the cell on the low E (6th) string, between frets 6 and 12, where that note lives.",
    "Once found, a new note rolls in — no mic needed, just click.",
  ],
  tips: [
    "Fret 12 repeats the open string an octave higher (E again) — use it as your ceiling.",
    "Frets 7 and 9 have inlay dots — anchor from there instead of counting all the way from fret 6.",
  ],
  whyItMatters: "This is the second half of the low E string, where most rock and metal rhythm riffs actually live. Extending your fret-0-to-6 knowledge up here removes the mental 'restart' most players do every time they move past the open position.",
  metronomeSpeed: null,
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  disableMic: true,
  customGoal: currentTarget,
  customGoalDescription: "Click this note on the low E string (frets 6-12)",
  customGoalRegion: { startFret: START_FRET, endFret: END_FRET },
  customGoalStrings: STRINGS,
  rollHuntTarget: () => {
    currentTarget = pickNote(currentTarget);
    return { goal: currentTarget, region: { startFret: START_FRET, endFret: END_FRET } };
  },
  noteHuntConfig: { rotateSeconds: 25, mode: "click" },
};
