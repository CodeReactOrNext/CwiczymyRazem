import type { DAILY_GOAL_OPTIONS } from "constants/dailyGoal";
import {
  FIRST_RIFF_SECONDS,
  firstRiffExercises,
} from "feature/exercisePlan/data/exerises/firstRiff/firstRiff";
import { fretClickFret5AllExercise } from "feature/exercisePlan/data/exerises/fretClickFret5All/fretClickFret5All";
import { fretClickLowEOpenExercise } from "feature/exercisePlan/data/exerises/fretClickLowEOpen/fretClickLowEOpen";
import { fretClickWholeNaturalExercise } from "feature/exercisePlan/data/exerises/fretClickWholeNatural/fretClickWholeNatural";
import type {
  Exercise,
  ExercisePlan,
} from "feature/exercisePlan/types/exercise.types";

import type { FirstMinuteKind, OnboardingLevel } from "../types";

export interface LevelOption {
  level: OnboardingLevel;
  /** Shown big, in Teko — the range itself is the picture. */
  years: string;
  unit: string;
  label: string;
  description: string;
}

/** The first question: how long has the player been playing? */
export const LEVEL_OPTIONS: LevelOption[] = [
  {
    level: "new",
    years: "0–1",
    unit: "year",
    label: "I'm just starting",
    description: "First chords, or I haven't picked up a guitar yet",
  },
  {
    level: "some",
    years: "1–3",
    unit: "years",
    label: "I know the basics",
    description: "Chords and simple songs, I want to get better",
  },
  {
    level: "experienced",
    years: "3+",
    unit: "years",
    label: "I've played for years",
    description: "Comfortable on the neck, I want to keep improving",
  },
];

// ─── Daily goal ────────────────────────────────────────────────────────────────

type DailyGoalMinutes = (typeof DAILY_GOAL_OPTIONS)[number];

/**
 * The second question: how long a day of practice should be. The answer is
 * the same setting as Settings → Daily goal (`statistics.dailyGoalMinutes`),
 * written the moment it is picked. Four of the eight settings choices, so the
 * step reads at a glance; the rest stay in Settings.
 */
export const DAILY_GOAL_CHOICES: {
  minutes: DailyGoalMinutes;
  vibe: "casual" | "regular" | "serious" | "intense";
}[] = [
  { minutes: 5, vibe: "casual" },
  { minutes: 15, vibe: "regular" },
  { minutes: 30, vibe: "serious" },
  { minutes: 60, vibe: "intense" },
];

// ─── The first minute ──────────────────────────────────────────────────────────

/** The 40-second first riff for each level (feature/exercisePlan/data/exerises/firstRiff). */
export const FIRST_RIFF_EXERCISE_IDS: Record<OnboardingLevel, string> = {
  new: "first_riff_open_strings",
  some: "first_riff_pentatonic",
  experienced: "first_riff_lead_lick",
};

export const getFirstRiffExercise = (level: OnboardingLevel): Exercise => {
  const exercise = firstRiffExercises.find(
    (ex) => ex.id === FIRST_RIFF_EXERCISE_IDS[level],
  );
  if (!exercise) throw new Error(`No first riff for level ${level}`);
  return exercise;
};

/** "0:40" — a length the way the session timer shows it. */
const asClock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export const FIRST_RIFF_DURATION_LABEL = asClock(FIRST_RIFF_SECONDS);

/**
 * The other first minute: the Fretboard module's Click Hunt — a note name
 * comes up, the player clicks where it lives. No guitar, no mic. The library
 * versions run 1:18; here they end after a minute, and keep their own id so
 * the run counts like any other.
 */
export const FIRST_HUNT_SECONDS = 60;
export const FIRST_HUNT_DURATION_LABEL = asClock(FIRST_HUNT_SECONDS);

const FIRST_HUNT_EXERCISES: Record<OnboardingLevel, Exercise> = {
  new: fretClickLowEOpenExercise,
  some: fretClickFret5AllExercise,
  experienced: fretClickWholeNaturalExercise,
};

export const getFirstHuntExercise = (level: OnboardingLevel): Exercise => ({
  ...FIRST_HUNT_EXERCISES[level],
  timeInMinutes: FIRST_HUNT_SECONDS / 60,
});

/**
 * What the hunt card draws for each level: where on the neck it plays
 * (a lit string or fret, or the whole neck) and the example target with its
 * spots. Strings count from 1 (high e) to 6 (low E), as in the tab.
 */
export interface HuntPreview {
  target: string;
  /** [string, fret] for every spot of `target` the card shows as found. */
  spots: [number, number][];
  region: { string: number } | { fret: number } | null;
}

export const FIRST_HUNT_PREVIEWS: Record<OnboardingLevel, HuntPreview> = {
  // Low E, frets 0–6: G is on fret 3.
  new: { target: "G", spots: [[6, 3]], region: { string: 6 } },
  // Fret 5, all strings: D only on the A string.
  some: { target: "D", spots: [[5, 5]], region: { fret: 5 } },
  // Naturals on the whole neck, shown frets 0–6: C on A3 and B1 (G5 still to find).
  experienced: {
    target: "C",
    spots: [
      [5, 3],
      [2, 1],
    ],
    region: null,
  },
};

/** One exercise as the plan a first-minute page hands to the practice session. */
export const toFirstMinutePlan = (
  exercise: Exercise,
  kind: FirstMinuteKind,
  userId: string,
): ExercisePlan => ({
  id: `onboarding-first-${kind}`,
  title: exercise.title,
  description: exercise.description,
  category: exercise.category,
  difficulty: exercise.difficulty,
  exercises: [exercise],
  createdAt: new Date(),
  updatedAt: new Date(),
  userId,
  image: null,
});

export const isOnboardingLevel = (value: unknown): value is OnboardingLevel =>
  value === "new" || value === "some" || value === "experienced";

/** Where the first riff opens; the source rides along for the analytics. */
export const getFirstRiffHref = (
  level: OnboardingLevel,
  source: string,
): string =>
  `/onboarding/first-riff?${new URLSearchParams({ level, from: source })}`;

/** Where the fretboard hunt opens. */
export const getFirstHuntHref = (
  level: OnboardingLevel,
  source: string,
): string =>
  `/onboarding/first-hunt?${new URLSearchParams({ level, from: source })}`;
