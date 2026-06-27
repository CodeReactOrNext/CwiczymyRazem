import { getNotePositionsInRange } from "feature/exercisePlan/scales/fretboardMapper";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

// Hardest variant: a chromatic target PLUS a fretboard window. The neck is shown
// with the window highlighted; the player must locate the note inside it. Both the
// note and the window re-roll together every 15s (see useNoteHuntRotation).

const REGION_WIDTH = 4;                       // window spans start..start+4 (5 frets shown)
const WINDOW_STARTS = [0, 2, 4, 5, 7, 9];     // musical, inlay-anchored starting frets

const pickFrom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

interface HuntTarget {
  note: string;
  startFret: number;
  endFret: number;
}

/** Pick a note (chromatic, never repeating) + a window guaranteed to contain it. */
const rollTarget = (excludeNote?: string): HuntTarget => {
  const notePool = excludeNote ? NOTES.filter((n) => n !== excludeNote) : NOTES;
  const note = pickFrom(notePool);
  const pitchClass = NOTES.indexOf(note);

  // Only keep windows where the note actually appears, so there's always something to hunt.
  const validStarts = WINDOW_STARTS.filter(
    (start) => getNotePositionsInRange(pitchClass, start, start + REGION_WIDTH).length > 0,
  );
  const startFret = pickFrom(validStarts.length ? validStarts : WINDOW_STARTS);
  return { note, startFret, endFret: startFret + REGION_WIDTH };
};

// Module-level so the target survives re-renders and stays fixed between rotations.
let current = rollTarget();

export const fretboardRegionHuntExercise: Exercise = {
  id: "fretboard_region_hunt",
  addedAt: "2026-06-25",
  isHiddenFromLanding: true,
  title: "Fretboard Region Hunt",
  description: "Locate a note inside a specific region of the neck shown on a fretboard diagram — under the clock.",
  difficulty: "hard",
  category: "theory",
  timeInMinutes: 4,
  instructions: [
    "A note and a highlighted fret window appear on the fretboard — find and play that note only within the window.",
    "Enable Pitch Detect so the app verifies your hits and lights up each position you find.",
    "Every 15 seconds the note AND the region change, so commit each position quickly.",
  ],
  tips: [
    "Read the fret numbers and string labels first to orient inside the window.",
    "Pitch detection hears the note, not the string — equal-pitch positions light together.",
    "Use reference points: inlays at frets 3, 5, 7, 9, 12 anchor the window fast.",
    "Visualize the note's shape in the box before reaching for it.",
  ],
  whyItMatters: "Locating a note inside an arbitrary position box — rather than sliding to the open-string area — is exactly what real playing demands. The rotating region trains positional fretboard recall across the whole neck under time pressure.",
  metronomeSpeed: { min: 40, max: 120, recommended: 60 },
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  customGoal: current.note,
  customGoalRegion: { startFret: current.startFret, endFret: current.endFret },
  customGoalDescription: "Find this note inside the highlighted region",
  rollHuntTarget: () => {
    current = rollTarget(current.note);
    return { goal: current.note, region: { startFret: current.startFret, endFret: current.endFret } };
  },
  noteHuntConfig: { rotateSeconds: 10, mode: "region" },
};
