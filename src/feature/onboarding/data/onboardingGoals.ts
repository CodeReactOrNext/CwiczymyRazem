import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import type { LucideIcon } from "lucide-react";
import { Compass, Dumbbell, Music, NotebookPen, Route } from "lucide-react";

import type { OnboardingGoal, OnboardingLevel } from "../types";

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
  icon: LucideIcon;
  label: string;
  description: string;
  /** Where the answer leads. `null` = the plan picker inside the onboarding. */
  href: string | null;
  /** The levels this answer makes sense for. */
  levels: OnboardingLevel[];
  /** A real screen or photo from the app, so the player sees where they land. */
  image: string;
  /** object-position for the image crop. */
  imagePosition: string;
}

const ALL_LEVELS: OnboardingLevel[] = ["new", "some", "experienced"];

/**
 * The second question: what did the player come here for? Each answer only
 * shows up for the levels it fits — someone who has played for years is not
 * offered learning guitar from scratch, and a beginner has no routine to log.
 */
export const GOAL_OPTIONS: GoalOption[] = [
  {
    goal: "journey",
    icon: Route,
    label: "Follow the Learning Path",
    description: "Learn guitar from scratch, one step at a time",
    href: "/journey",
    levels: ["new"],
    image: "/images/onboarding/learning-path.webp",
    imagePosition: "object-[50%_30%]",
  },
  {
    goal: "plans",
    icon: Dumbbell,
    label: "Practice with exercise plans",
    description: "Ready-made routines with a timer that guides you",
    href: null,
    levels: ALL_LEVELS,
    image: "/images/plans-library.webp",
    imagePosition: "object-left-top",
  },
  {
    goal: "songs",
    icon: Music,
    label: "Learn songs and track them",
    description: "Save songs you want to play and see your progress",
    href: "/songs?view=management",
    levels: ALL_LEVELS,
    image: "/images/songs-library.webp",
    imagePosition: "object-left-top",
  },
  {
    goal: "roadmap",
    icon: Compass,
    label: "Follow a roadmap to a goal",
    description: "A step-by-step path, like playing in the style of your hero",
    href: "/ai-coach",
    levels: ["some", "experienced"],
    image: "/images/roadmap/hendrix.webp",
    imagePosition: "object-[50%_20%]",
  },
  {
    goal: "log",
    icon: NotebookPen,
    label: "Log the practice I already do",
    description: "Track your time, streak and progress",
    href: "/report",
    levels: ["some", "experienced"],
    image: "/images/wiki/log-session-time.webp",
    imagePosition: "object-left-top",
  },
];

export const getGoalOptions = (level: OnboardingLevel): GoalOption[] =>
  GOAL_OPTIONS.filter((option) => option.levels.includes(level));

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
