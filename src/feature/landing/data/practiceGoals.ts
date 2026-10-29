import {
  GOAL_CLEAN_RUNS_REQUIRED,
  MAX_GOAL_STAGES,
  STRICTNESS_ACCURACY,
} from "feature/exerciseGoals/utils/goalRules";
import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";
import { MIN_SONG_PRACTICE_MS } from "feature/rotation/utils/lastPracticed";
import {
  COOLING_AFTER_DAYS,
  CUSTOM_SLOT_MINUTES,
  MAX_ROTATION_ITEMS,
  ROTATION_SONG_MINUTES,
  RUSTY_AFTER_DAYS,
  STALEST_SESSION_SIZE,
} from "feature/rotation/utils/rotation.utils";

/**
 * Feature landing for Exercise Goals (`/goals`) and Rotation (`/rotation`),
 * told as one loop: climb an exercise to a tempo, then keep it — and the
 * songs and skills you already have — from going rusty.
 *
 * Numbers come from goalRules / rotation.utils, never retyped. The wiki
 * articles `exercise-goals` and `rotation` stay the how-to.
 */
export const PRACTICE_GOALS_META = {
  slug: "features/guitar-practice-goals",
  eyebrow: "Goals and Rotation",
  title: "Get faster at what matters. Keep what you already have.",
  /** SERP title, brand included; ≤ 60 chars. */
  metaTitle: "Guitar Practice Goals and Repertoire Rotation | Riff Quest",
  /** ≤ 160 chars. */
  metaDescription:
    "Set a tempo goal on any tab exercise and climb it milestone by milestone, three clean runs each. Then keep songs and skills fresh with a rotation.",
  publishedAt: "2026-10-29",
  updatedAt: "2026-10-29",
  /** Hand-made WebP (images.unoptimized is on), also the og:image. */
  ogImage: "/images/practice-goals/og.webp",
} as const;

const signupThen = (path: string) => `/signup?next=${encodeURIComponent(path)}`;

export const PRACTICE_GOALS_ROUTES = {
  goals: signupThen("/goals"),
  rotation: signupThen("/rotation"),
} as const;

export type PracticeGoalsTarget = keyof typeof PRACTICE_GOALS_ROUTES;

/** The exercise both halves of the hero follow: climbed, then kept. */
export const PRACTICE_GOALS_SHOWCASE = {
  exerciseId: "spider_permutation_3241",
  startBpm: 80,
  targetBpm: 120,
} as const;

export const PRACTICE_GOALS_NUMBERS = {
  cleanRuns: GOAL_CLEAN_RUNS_REQUIRED,
  maxStages: MAX_GOAL_STAGES,
  strictness: STRICTNESS_ACCURACY,
  coolingDays: COOLING_AFTER_DAYS,
  rustyDays: RUSTY_AFTER_DAYS,
  maxItems: MAX_ROTATION_ITEMS,
  songMinutes: ROTATION_SONG_MINUTES,
  customMinutes: CUSTOM_SLOT_MINUTES,
  stalest: STALEST_SESSION_SIZE,
  minPracticeSeconds: MIN_SONG_PRACTICE_MS / 1000,
} as const;

export const PRACTICE_GOALS_CLIMB = [
  {
    label: "Pick an exercise and two tempos",
    desc: "Where you can play it today, and where you want it. Any exercise with a tab works, the ones you wrote yourself included.",
  },
  {
    label: "Milestones in between",
    desc: `The climb is cut into round steps, 5 BPM at a time, with bigger steps on a long climb so there are never more than ${MAX_GOAL_STAGES}.`,
  },
  {
    label: `${GOAL_CLEAN_RUNS_REQUIRED} clean runs per milestone`,
    desc: `A run counts when the microphone scores it at the milestone's tempo with enough accuracy: ${STRICTNESS_ACCURACY.relaxed}%, ${STRICTNESS_ACCURACY.standard}% or ${STRICTNESS_ACCURACY.strict}%, your choice. In a row, or in total.`,
  },
  {
    label: "A chart of the whole way up",
    desc: "Every scored run of that exercise played on its own lands on one chart, tempo or timing, practice runs included, so you can see the climb that got you there.",
  },
] as const;

export const PRACTICE_GOALS_KEEP = [
  {
    label: "Anything you do not want to lose",
    desc: `Songs from your library, exercises, whole skills, or your own items with a note and a link, such as the next lesson of a course. Up to ${MAX_ROTATION_ITEMS} of them.`,
  },
  {
    label: "Fresh, cooling down, getting rusty",
    desc: `Played within ${COOLING_AFTER_DAYS} days is fresh, up to ${RUSTY_AFTER_DAYS} is cooling down, after that it is getting rusty. Five dots drain day by day, and the stalest rise to the top.`,
  },
  {
    label: `Play the ${STALEST_SESSION_SIZE} stalest`,
    desc: `One tap puts the three you have not played for longest into a short session: ${ROTATION_SONG_MINUTES} minutes per song, exercises at their usual length.`,
  },
  {
    label: "Or draw a card",
    desc: "For days you want to play but not to choose: one random item, more often something that has sat for a while.",
  },
] as const;

export const PRACTICE_GOALS_FAQS: faqQuestionInterface[] = [
  {
    title: "Do I need a microphone?",
    message:
      "For goals, yes: a run only counts when the microphone scores it. Rotation works without one, because anything you practise for long enough counts, logged or played.",
  },
  {
    title: "Which exercises can take a goal?",
    message:
      "Exercises with a tab and a metronome tempo, because those are the ones the microphone grades note by note. Your own exercises from the tab editor count too. Hunts, quizzes and songs cannot take one.",
  },
  {
    title: "Do goals give points or Fame?",
    message:
      "No. The practice time of a goal run logs like any other session, and reaching a goal shows up in the feed, but the reward is the tempo.",
  },
  {
    title: "What counts as playing a rotation item?",
    message: `Anything you play, wherever you play it: a rotation session, a routine, an exercise from the library or a song you log by hand. An exercise counts after ${MIN_SONG_PRACTICE_MS / 1000} seconds. Sessions logged for an earlier day do not move anything.`,
  },
  {
    title: "Do I have to clear my rotation every day?",
    message:
      "No. Nothing piles up and there is nothing to empty. It only tells you what you have not played for a while.",
  },
  {
    title: "What happens when I reach a goal?",
    message:
      "The exercise's speeds mastered go up to the goal tempo, and you are offered a new goal about 10% faster. If you would rather keep it where it is, put it in your rotation.",
  },
];
