import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";

/**
 * Copy and fixed data for the /guitar-practice-planner landing: the product
 * page for choosing a ready-made routine, building a custom plan, or letting
 * Auto Plan assemble a session.
 *
 * Intent split agreed in the 2026-09-19 duplication review:
 * - this page shows the planning tool itself and hands the visitor into it;
 * - `/daily-guitar-practice-plan` owns the 15/30/60 schedules and the advice
 *   on what to practise;
 * - `/wiki/exercise-plans-and-auto-plan` owns the how-to (filters, sharing,
 *   edge cases);
 * - `/intermediate-guitar-practice-routine` owns the intermediate programme.
 * Keep it that way: a "how long should I practise" block or a 7-day schedule
 * belongs on one of those pages, not here.
 */
export const PRACTICE_PLANNER_META = {
  slug: "guitar-practice-planner",
  eyebrow: "Guitar practice planner",
  title: "Give your next guitar session a plan.",
  /** SERP title, brand included; ≤ 60 chars. */
  metaTitle: "Guitar Practice Planner: Build Your Routine | Riff Quest",
  /** ≤ 160 chars. */
  metaDescription:
    "Build your guitar practice plan with ready-made routines, custom exercises and Auto Plan. See a 20-minute example and plan your next session with Riff Quest.",
  publishedAt: "2026-09-20",
  updatedAt: "2026-09-20",
  /** Hand-made WebP (images.unoptimized is on), also the og:image. */
  ogImage: "/images/practice-planner/og.webp",
} as const;

/**
 * The three product destinations. Every one sits behind sign-in (`withAuth`
 * on the timer routes, `AppLayout` on the builder), and the sign-in redirect
 * drops the destination, so links go through sign-up with `next`: a guest
 * gets the form and then the feature, a signed-in visitor is redirected
 * straight to `next` by the sign-up page's `redirectIfAuthenticated`.
 */
const signupThen = (path: string) =>
  `/signup?next=${encodeURIComponent(path)}` as const;

export const PRACTICE_PLANNER_ROUTES = {
  routines: { path: "/timer/plans", href: signupThen("/timer/plans") },
  builder: { path: "/plans/create", href: signupThen("/plans/create") },
  autoPlan: { path: "/timer/auto", href: signupThen("/timer/auto") },
} as const;

export type PlannerTarget = keyof typeof PRACTICE_PLANNER_ROUTES | "example";

/** Anchor of the worked example, linked from the hero's secondary button. */
export const PRACTICE_PLANNER_EXAMPLE_ANCHOR = "20-minute-session";

/**
 * Ready-made routines shown as proof, by plan id. The title, category,
 * difficulty, total minutes and exercise count are read from `defaultPlans`
 * at build time so the cards cannot drift from the library (brief §2).
 */
export const PRACTICE_PLANNER_ROUTINE_IDS = [
  "mega_beginner_first_steps",
  "beginner_daily_exercises",
  "strumming_foundations",
] as const;

/**
 * The 20-minute example built in the custom planner (screens 05/06 of the
 * brief). Minutes were set by hand in the wizard, not taken from the
 * exercises' default durations, so they live here; the title, category and
 * description come from `exercisesAgregat` at build time.
 */
export const PRACTICE_PLANNER_EXAMPLE = {
  name: "20-Minute Focus Session",
  totalMinutes: 20,
  blocks: [
    { exerciseId: "spider_one_string", minutes: 3, goal: "Coordination" },
    { exerciseId: "hammer_on_pentatonic_run", minutes: 5, goal: "Legato" },
    { exerciseId: "earTrainingEasy", minutes: 4, goal: "Ear training" },
    {
      exerciseId: "two_notes_per_bar_phrasing",
      minutes: 8,
      goal: "Phrasing",
    },
  ],
} as const;

/**
 * Three product objections. Session length, habit building and the
 * intermediate programme are answered by the guides this page links to.
 */
export const PRACTICE_PLANNER_FAQS: faqQuestionInterface[] = [
  {
    title: "Can I build a 20-minute guitar practice plan?",
    message:
      "Yes. In the custom planner, assign a duration to each exercise so the blocks add up to 20 minutes. The example above uses four exercises.",
  },
  {
    title: "Can I change an Auto Plan before starting?",
    message:
      "Yes. Review the generated exercises, swap or remove an exercise, and adjust the order before you start.",
  },
  {
    title: "Where can I find a complete daily routine guide?",
    message:
      "See our daily guitar practice plan guide for example routines for 15, 30 and 60 minutes and practice advice on what to play each day.",
  },
];
