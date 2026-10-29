import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";
import {
  ROADMAP_ADD_STEPS_MAX,
  ROADMAP_GENERATION_COST,
  ROADMAP_PRIVATE_GENERATION_COST,
  ROADMAP_REFINE_COSTS,
  SUPPORTER_WELCOME_TOKENS,
  TOKENS_PER_DOLLAR,
} from "feature/supporterPanel/constants/supporterPanel.constants";
import { MAX_QUESTIONS } from "lib/roadmaps/generation/questionBank";

/**
 * Feature landing for Player Roadmaps (`/my-roadmaps` in the app).
 *
 * Intent: "a plan for MY goal" — somebody who knows who they want to sound
 * like but not what to practise on Tuesday. The fixed paths live on
 * `/features/guitar-learning-path`, routines on `/guitar-practice-planner`.
 *
 * The page is honest about the one thing that is not free: a roadmap is
 * written by a model that costs money per run, so Player Roadmaps open with
 * a donation. Prices are read from the supporter constants, never retyped.
 */
export const PLAYER_ROADMAPS_META = {
  slug: "features/guitar-roadmap",
  eyebrow: "Player Roadmaps",
  title: "A guitar roadmap written around your goal",
  /** SERP title, brand included; ≤ 60 chars. */
  metaTitle: "Guitar Roadmap Built Around Your Own Goal | Riff Quest",
  /** ≤ 160 chars. */
  metaDescription:
    "Describe the guitarist you want to be and get a roadmap of 6–8 phases. Every step comes with an exercise, video lessons picked for it, or a song to learn.",
  publishedAt: "2026-10-29",
  updatedAt: "2026-10-29",
  /** Hand-made WebP (images.unoptimized is on), also the og:image. */
  ogImage: "/images/player-roadmaps/og.webp",
} as const;

/**
 * `/my-roadmaps` sends signed-out visitors to /login, which drops the
 * destination, so the CTA goes through sign-up with `next`.
 */
const signupThen = (path: string) => `/signup?next=${encodeURIComponent(path)}`;

export const PLAYER_ROADMAPS_APP_PATH = "/my-roadmaps";
export const PLAYER_ROADMAPS_CTA_HREF = signupThen(PLAYER_ROADMAPS_APP_PATH);

/** Anchor of the real-roadmap walkthrough, linked from the hero. */
export const PLAYER_ROADMAPS_EXAMPLE_ANCHOR = "example";

/** How a roadmap gets made, in the order the job runs it. */
export const PLAYER_ROADMAPS_PIPELINE = [
  {
    title: "You describe the goal",
    text: "A title and a paragraph in your own words: who you want to sound like, which songs you are after, what you want your hands to be able to do. Add your level, the artists you love and what you can already play if you like.",
  },
  {
    title: "A check and a few questions, before anything is spent",
    text: `A quick read of the goal comes first. If it is not about guitar, or too vague to plan, it says so and nothing is charged. Otherwise it asks up to ${MAX_QUESTIONS} questions, such as which songs to build towards or where to start, and any of them can be skipped.`,
  },
  {
    title: "A draft, then a second opinion",
    text: "The phases are drafted first. A separate review pass then reads the draft against your goal and your answers, and rewrites what does not hold up before a single step is written out.",
  },
  {
    title: "Every step gets its kit",
    text: "Each step is written out and matched with an exercise from the Riff Quest library. For the lessons, a judge reads up to 30 indexed videos and keeps the three at most that teach this exact step. When none fits, it searches YouTube for one that does. Songs you named get steps of their own when they are in the song library.",
  },
  {
    title: "Ready while you were away",
    text: "Writing takes a few minutes and runs on our servers, not in your browser. Close the tab: a notification tells you when the roadmap is waiting.",
  },
] as const;

/** What one step of a roadmap is made of, in the order the drawer shows it. */
export const PLAYER_ROADMAPS_STEP_PARTS = [
  {
    label: "What, why and how",
    desc: "What the skill is, why your goal needs it, and how to practise it, with tempos and bar counts rather than pep talk.",
  },
  {
    label: "When it counts as done",
    desc: "A finish line you can check yourself, so you know when to move on instead of guessing.",
  },
  {
    label: "An exercise you can open",
    desc: "A drill from the Riff Quest library, one click from the step, ready to play in a practice session.",
  },
  {
    label: "Lessons picked for that step",
    desc: "Videos from teachers on YouTube, chosen for this step rather than for the topic in general. Watch one in the app and it ticks itself off.",
  },
] as const;

/** One row of the price list: what it buys and what it costs in tokens. */
export interface PlayerRoadmapsPrice {
  label: string;
  note: string;
  /** Tokens; 0 = free. */
  tokens: number;
}

export const PLAYER_ROADMAPS_PRICES: PlayerRoadmapsPrice[] = [
  {
    label: "Public roadmap",
    note: "Shows up for other supporters, who can start it too.",
    tokens: ROADMAP_GENERATION_COST,
  },
  {
    label: "Private roadmap",
    note: "Only you see it. Dearer, because nobody else learns from it.",
    tokens: ROADMAP_PRIVATE_GENERATION_COST,
  },
  {
    label: "Fix one step",
    note: "Rewrite it, swap its exercise, look for lessons or the song again.",
    tokens: ROADMAP_REFINE_COSTS.rewriteStep,
  },
  {
    label: "Add a step to a phase",
    note: `Up to ${ROADMAP_ADD_STEPS_MAX} at a time.`,
    tokens: ROADMAP_REFINE_COSTS.addStep,
  },
  {
    label: "Remove a step, or start someone else's roadmap",
    note: "Costs the app nothing, so it costs you nothing.",
    tokens: 0,
  },
];

export const PLAYER_ROADMAPS_TOKEN_NOTE = `Every $1 donated adds ${TOKENS_PER_DOLLAR} tokens and the supporter badge comes with ${SUPPORTER_WELCOME_TOKENS}. Tokens never expire, and a roadmap that fails to generate is refunded.`;

export const PLAYER_ROADMAPS_FAQS: faqQuestionInterface[] = [
  {
    title: "Is it free?",
    message: `Riff Quest itself is free, with no paywalls. Player Roadmaps are the one exception: every roadmap is written by an AI model that costs real money per run, so they open with a donation of any size, for life, with no subscription. A public roadmap then costs ${ROADMAP_GENERATION_COST} tokens and a private one ${ROADMAP_PRIVATE_GENERATION_COST}.`,
  },
  {
    title: "Does it make up exercises or songs?",
    message:
      "No. Exercises come only from the Riff Quest library. A step is tied to a song only when that song is in the song library, so it opens with a tab and a backing track. The lessons are real YouTube videos, picked step by step.",
  },
  {
    title: "What if a step is wrong for me?",
    message: `Open the roadmap in refine mode and fix that step: have it rewritten, swap its exercise, or look for lessons or the song again for ${ROADMAP_REFINE_COSTS.rewriteStep} token each. Adding a step costs ${ROADMAP_REFINE_COSTS.addStep}, removing one is free.`,
  },
  {
    title: "How do I tick off a step?",
    message:
      "Open the step, play its exercise and tick it, and watch its lessons in the app, which ticks them for you. A step with nothing to play can be marked done by hand. The map colours every step as not started, in progress or done.",
  },
  {
    title: "Can I use a roadmap someone else made?",
    message:
      "Yes. Supporters can open any public roadmap and start it for free. The plan stays the author's, the progress is yours. Private roadmaps never show up for anyone but their owner.",
  },
  {
    title: "How long does it take to write one?",
    message:
      "A few minutes. It runs on our servers, so you can leave the page or close the tab and come back when the notification arrives.",
  },
];
