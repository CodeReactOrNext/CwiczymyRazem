import {
  FIVE_DAY_MULTIPLER,
  HABBITS_POINTS_VALUE,
  TIME_POINTS_VALUE,
} from "constants/ratingValue";
import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";
import { getDailyStreakMultiplier } from "utils/gameLogic/getDailyStreakMultiplier";
import { getPointsToLvlUp } from "utils/gameLogic/getPointsToLvlUp";

/**
 * Feature landing for progress: points, the streak multiplier, levels, the
 * stats, skills, achievements and the profile — everything the app adds up
 * from logged practice.
 *
 * Intent split: `/guitar-practice-journal` is the printable paper log; this
 * page is the tracker that keeps the books for you. The wiki articles
 * `how-scoring-works` and `skills-and-achievements` stay the how-to.
 */
export const PROGRESS_META = {
  slug: "features/guitar-progress-tracker",
  eyebrow: "Progress",
  title: "See what your practice actually built.",
  /** SERP title, brand included; ≤ 60 chars. */
  metaTitle: "Guitar Progress Tracker: Skills, Stats, Levels | Riff Quest",
  /** ≤ 160 chars. */
  metaDescription:
    "Log guitar practice and see it add up: points and levels, a streak bonus, time per category, 22 skills that grow with every exercise and 77 achievements.",
  publishedAt: "2026-10-29",
  updatedAt: "2026-10-29",
  /** Hand-made WebP (images.unoptimized is on), also the og:image. */
  ogImage: "/images/progress-tracker/og.webp",
} as const;

const signupThen = (path: string) => `/signup?next=${encodeURIComponent(path)}`;

export const PROGRESS_APP_PATH = "/report";
export const PROGRESS_CTA_HREF = signupThen(PROGRESS_APP_PATH);

/** The healthy habits a logged session can tick, one point each. */
export const PROGRESS_HABITS = [
  "Warm-up",
  "Metronome",
  "Learned something new",
  "Exercise plan",
  "Recording",
] as const;

/**
 * Points for one logged session, the way the app's report computes them
 * (`makeRatingData`): time and habits, then the streak bonus on both. The test
 * checks it against the real function.
 */
export const sessionPoints = (
  minutes: number,
  habits: number,
  streakDay: number,
) => {
  const time = Math.floor(minutes * 60_000 * TIME_POINTS_VALUE);
  const habitPoints = Math.floor(habits * HABBITS_POINTS_VALUE);
  const multiplier = getDailyStreakMultiplier(streakDay);
  const bonus = Math.floor((time + habitPoints) * multiplier);
  return {
    time,
    habits: habitPoints,
    bonus,
    multiplier,
    total: time + habitPoints + bonus,
  };
};

export const PROGRESS_POINTS_PER_HOUR = Math.floor(
  60 * 60_000 * TIME_POINTS_VALUE,
);
export const PROGRESS_MAX_STREAK_BONUS = Math.round(FIVE_DAY_MULTIPLER * 100);

/** Points from one level to the next, for a few levels along the way. */
export const PROGRESS_LEVEL_STEPS = [1, 5, 10, 20, 40].map((level) => ({
  level,
  points: getPointsToLvlUp(level),
}));

export const PROGRESS_STATS = [
  {
    label: "Time, by category",
    desc: "Technique, theory, hearing and creativity, so you can see which one has been quietly left behind.",
  },
  {
    label: "Every session on a timeline",
    desc: "Your practice history as a chart and a heatmap of days, back to your first session.",
  },
  {
    label: "The numbers that matter",
    desc: "Average session length, points per hour, your longest session and your best streak.",
  },
  {
    label: "Per song and per exercise",
    desc: "Time spent on each song, your best score on each exercise and the tempo you reached.",
  },
] as const;

export const PROGRESS_FAQS: faqQuestionInterface[] = [
  {
    title: "Do I have to log everything by hand?",
    message:
      "No. Practise in the app and the log form opens with the time and the exercises already filled in; you only save it. Practice away from the app can be logged by hand in a few seconds, up to a week back.",
  },
  {
    title: "Can my points go down?",
    message:
      "Only by undoing something you were paid for, such as moving a song back out of Mastered. Nothing is taken away for a quiet week.",
  },
  {
    title: "Do longer sessions pay more per hour?",
    message: `No. Practice pays a flat ${PROGRESS_POINTS_PER_HOUR} points an hour. The bonus comes from the streak: practising on consecutive days adds up to ${PROGRESS_MAX_STREAK_BONUS}% to everything you log.`,
  },
  {
    title: "How do skills grow?",
    message:
      "Every exercise is tagged with the skills it trains, and finishing it in a logged session adds to those skills. Skills never go down: the number is a record of attention paid, not a grade.",
  },
  {
    title: "Do achievements give rewards?",
    message:
      "They pay no points and no Fame. They unlock titles, profile banners and accent colours, and you can pin your favourites to your profile.",
  },
  {
    title: "How is this different from a practice journal?",
    message:
      "A paper journal records what you write down. The tracker adds it up for you: totals per category, streaks, levels, skills and a history you can scroll back through.",
  },
];
