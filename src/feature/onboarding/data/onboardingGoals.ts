import {
  FIRST_RIFF_SECONDS,
  firstRiffExercises,
} from "feature/exercisePlan/data/exerises/firstRiff/firstRiff";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import type {
  Exercise,
  ExercisePlan,
} from "feature/exercisePlan/types/exercise.types";

import type {
  OnboardingGoal,
  OnboardingLevel,
  OnboardingPlayChoice,
} from "../types";

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

export interface GoalOption {
  goal: OnboardingGoal;
  label: string;
  description: string;
  /** Where the answer leads. `null` = the plan picker inside the onboarding. */
  href: string | null;
  /** The levels this answer makes sense for. */
  levels: OnboardingLevel[];
  /** Left out on phones, where it led nowhere. */
  hiddenOnPhone?: boolean;
  /** A real screen or photo from the app, so the player sees where they land. */
  image: string;
  /** object-position for the image crop. */
  imagePosition: string;
}

const ALL_LEVELS: OnboardingLevel[] = ["new", "some", "experienced"];

/**
 * Where the songs answer lands. The onboarding first stops on its own step to
 * say there are no tabs here — players picking it expected them.
 */
export const SONGS_HREF = "/songs?view=management";

/**
 * The second question: what did the player come here for? Each answer only
 * shows up for the levels it fits — someone who has played for years is not
 * offered learning guitar from scratch.
 *
 * The roadmap answer is desktop-only: from 24.10 to 05.11.2026 eight phone
 * players picked it and none of them started a session. "Log the practice I
 * already do" is gone everywhere, since 8 of ~150 players picked it.
 */
export const GOAL_OPTIONS: GoalOption[] = [
  {
    goal: "journey",
    label: "Follow the Learning Path",
    description: "Learn guitar from scratch, one step at a time",
    href: "/journey",
    levels: ["new"],
    image: "/images/onboarding/learning-path.webp",
    imagePosition: "object-[50%_30%]",
  },
  {
    goal: "plans",
    label: "Practice with exercise plans",
    description: "Ready-made routines with a timer that guides you",
    href: null,
    levels: ALL_LEVELS,
    image: "/images/plans-library.webp",
    imagePosition: "object-left-top",
  },
  {
    goal: "songs",
    label: "Learn songs and track them",
    description: "Save songs you want to play and see your progress",
    href: SONGS_HREF,
    levels: ALL_LEVELS,
    image: "/images/songs-library.webp",
    imagePosition: "object-left-top",
  },
  {
    goal: "roadmap",
    label: "Follow a roadmap to a goal",
    description: "A step-by-step path, like playing in the style of your hero",
    href: "/ai-coach",
    levels: ["some", "experienced"],
    hiddenOnPhone: true,
    image: "/images/roadmap/hendrix.webp",
    imagePosition: "object-[50%_20%]",
  },
];

export const getGoalOptions = (
  level: OnboardingLevel,
  { isPhone = false }: { isPhone?: boolean } = {},
): GoalOption[] =>
  GOAL_OPTIONS.filter(
    (option) =>
      option.levels.includes(level) && !(isPhone && option.hiddenOnPhone),
  );

/**
 * Plans offered on the plan step, per level — all free and short enough for a
 * first evening, gentlest first. The full library is one link away for anyone
 * who wants something else.
 */
export const LEVEL_PLAN_IDS: Record<OnboardingLevel, string[]> = {
  new: [
    "mega_beginner_first_steps",
    "beginner_daily_exercises",
    "strumming_foundations",
    "ear_rhythm_fundamentals",
    "musician_fitness_lvl1_s1",
  ],
  some: [
    "daily_dexterity_starter",
    "strumming_foundations",
    "rhythm_timing_foundations",
    "gp_pentatonic_tutorial",
    "musician_fitness_lvl1_s1",
    "ear_rhythm_fundamentals",
  ],
  experienced: [
    "warm_up_15_minutes",
    "spider_master_plan",
    "gp_pentatonic_10min_workout",
    "gp_alternate_picking_speed_builder",
    "gp_rock_metal_riffs",
    "ear_training_lab",
  ],
};

export const getOnboardingPlans = (level: OnboardingLevel): ExercisePlan[] =>
  LEVEL_PLAN_IDS[level]
    .map((id) => defaultPlans.find((plan) => plan.id === id))
    .filter((plan): plan is ExercisePlan => !!plan);

export const getPlanMinutes = (plan: ExercisePlan): number =>
  Math.round(
    plan.exercises.reduce(
      (sum, exercise) => sum + (exercise.timeInMinutes ?? 0),
      0,
    ),
  );

/** Opens the chosen plan in the practice screen (the timer waits for Play). */
export const getPlanHref = (planId: string): string =>
  `/timer/plans?planId=${encodeURIComponent(planId)}`;

export const ALL_PLANS_HREF = "/timer/plans";
export const ALL_PLANS_COUNT = defaultPlans.length;

/**
 * The quiet answers under the first-riff card: both show the app without
 * dropping the player into an exercise.
 */
export const LOOK_AROUND_CHOICES: Exclude<OnboardingPlayChoice, "play">[] = [
  "browse",
  "no_guitar",
];

export const LOOK_AROUND_LABELS: Record<
  Exclude<OnboardingPlayChoice, "play">,
  string
> = {
  browse: "Look around first",
  no_guitar: "I don't have a guitar yet",
};

/**
 * A crop of the real practice screen (tabs-live-mobile.webp): coloured notes
 * on the strings, the same thing the first riff shows a moment later.
 */
export const FIRST_RIFF_IMAGE = "/images/onboarding/first-riff-tab.webp";

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

/** "0:40" — the riff's length as the session timer shows it. */
export const FIRST_RIFF_DURATION_LABEL = `${Math.floor(FIRST_RIFF_SECONDS / 60)}:${String(
  FIRST_RIFF_SECONDS % 60,
).padStart(2, "0")}`;

export const isOnboardingLevel = (value: unknown): value is OnboardingLevel =>
  value === "new" || value === "some" || value === "experienced";

/** Where "Yes, let's play" goes; the source rides along so the way back keeps it. */
export const getFirstRiffHref = (
  level: OnboardingLevel,
  source: string,
): string =>
  `/onboarding/first-riff?${new URLSearchParams({ level, from: source })}`;

/** Back from the first riff: straight to the goal question, the level already known. */
export const getAfterFirstRiffHref = (
  level: OnboardingLevel,
  source: string,
): string =>
  `/onboarding?${new URLSearchParams({ step: "goal", level, played: "1", from: source })}`;
