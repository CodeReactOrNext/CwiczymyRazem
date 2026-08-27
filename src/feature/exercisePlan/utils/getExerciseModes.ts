import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { isNoGuitarExercise } from "feature/exercisePlan/utils/isNoGuitarExercise";

/**
 * How an exercise is actually practised — the question a player asks before any
 * other ("I want to grind a metronome" / "I'm on a bus, no guitar"). Every mode
 * is derived from the exercise config, so nothing has to be typed into the 200+
 * exercise files by hand.
 */
export type PracticeMode =
  | "bpm"
  | "tab"
  | "fretboard"
  | "ear"
  | "strum"
  | "open"
  | "noGuitar";

/** Display order in the filter bar — broadest first. */
export const PRACTICE_MODES: PracticeMode[] = [
  "bpm",
  "tab",
  "strum",
  "fretboard",
  "ear",
  "open",
  "noGuitar",
];

export const PRACTICE_MODE_LABELS: Record<PracticeMode, string> = {
  bpm: "Metronome",
  tab: "Tablature",
  strum: "Strumming",
  fretboard: "Fretboard",
  ear: "Listening quiz",
  open: "Open practice",
  noGuitar: "No guitar",
};

type ModeSource = Pick<
  Exercise,
  | "metronomeSpeed"
  | "tablature"
  | "strummingPatterns"
  | "noteHuntConfig"
  | "earQuizConfig"
  | "riddleConfig"
  | "noGuitarNeeded"
>;

/**
 * Modes an exercise belongs to. An exercise usually carries several — a tab
 * drill almost always has a BPM ladder too — so the filter treats them as OR.
 *
 * "open" is the catch-all for the exercises the session runs without scoring
 * anything mechanical: improv prompts, the voice-leading and tone drills. It is
 * assigned when nothing else matched, so a new exercise shape never falls out
 * of every mode and becomes unfilterable.
 */
export const getExerciseModes = (exercise: ModeSource): PracticeMode[] => {
  const modes: PracticeMode[] = [];

  if (exercise.metronomeSpeed) modes.push("bpm");
  if (exercise.tablature?.length) modes.push("tab");
  if (exercise.strummingPatterns?.length) modes.push("strum");
  if (exercise.noteHuntConfig) modes.push("fretboard");
  if (exercise.earQuizConfig) modes.push("ear");
  if (exercise.riddleConfig) modes.push("open");

  // Nothing mechanical to grade — an open drill the player judges themselves.
  if (modes.length === 0) modes.push("open");

  if (isNoGuitarExercise(exercise)) modes.push("noGuitar");

  return modes;
};
