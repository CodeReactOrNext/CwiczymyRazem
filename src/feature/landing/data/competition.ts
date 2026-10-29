import { SEASON_FAME_REWARDS } from "constants/seasonRewards";
import {
  CHALLENGE_SONG_COUNT,
  FAME_CLEAR_BONUS,
  FAME_PER_SUBMISSION,
  POINTS_PER_SUBMISSION,
  VOTES_PER_USER,
} from "feature/challenges/types/challenge.types";
import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";

/**
 * Feature landing for the competitive side: the monthly season and the other
 * two boards, Monthly Challenges and the exercise of the day. Duels have a page
 * of their own and are only linked.
 *
 * Every number is read from the code that pays it. The wiki articles
 * `leaderboard-and-seasons` and `monthly-challenges` stay the how-to.
 */
export const COMPETITION_META = {
  slug: "features/guitar-practice-leaderboard",
  eyebrow: "Rankings",
  title: "Practice counts. See where it puts you.",
  /** SERP title, brand included; ≤ 60 chars. */
  metaTitle: "Guitar Practice Leaderboard and Monthly Seasons | Riff Quest",
  /** ≤ 160 chars. */
  metaDescription:
    "A guitar practice leaderboard that resets every month, with Fame for the top ten, five community-voted challenge songs and one exercise of the day for all.",
  publishedAt: "2026-10-29",
  updatedAt: "2026-10-29",
  /** Hand-made WebP (images.unoptimized is on), also the og:image. */
  ogImage: "/images/practice-leaderboard/og.webp",
} as const;

const signupThen = (path: string) => `/signup?next=${encodeURIComponent(path)}`;

export const COMPETITION_ROUTES = {
  seasons: signupThen("/seasons"),
  challenges: signupThen("/challenges"),
} as const;

export type CompetitionTarget = keyof typeof COMPETITION_ROUTES;

export const COMPETITION_SEASON_REWARDS = SEASON_FAME_REWARDS;

export const COMPETITION_CHALLENGE = {
  songs: CHALLENGE_SONG_COUNT,
  points: POINTS_PER_SUBMISSION,
  fame: FAME_PER_SUBMISSION,
  clearBonus: FAME_CLEAR_BONUS,
  votes: VOTES_PER_USER,
} as const;

export const COMPETITION_BOARDS = [
  {
    title: "Seasons",
    text: "Only the points you earned this calendar month. Everyone starts from zero on the 1st, so a player who joined last week can win it.",
  },
  {
    title: "All-time",
    text: "Total points and sessions since the day you joined. The board for years of showing up.",
  },
  {
    title: "Gear",
    text: "Nothing to do with practice points: it ranks the rigs players have built in the Arsenal with the Fame their practice earned.",
  },
] as const;

export const COMPETITION_SEASON_COUNTS = [
  {
    label: "What counts",
    desc: "Practice time, healthy habits, daily quests and challenge recordings, everything you did this month.",
  },
  {
    label: "What does not",
    desc: "One-off rewards you can only collect once, such as learning a song or clearing a Scale Map box. They go on your all-time total instead.",
  },
  {
    label: "Nothing is lost",
    desc: "On the 1st the season resets, your all-time points stay exactly where they were.",
  },
] as const;

export const COMPETITION_FAQS: faqQuestionInterface[] = [
  {
    title: "Can a beginner win a season?",
    message:
      "Yes. A season counts only the current month, so it rewards how much you practise now, not how long you have been around. The all-time board is the one that favours veterans.",
  },
  {
    title: "Why did my rank not move straight away?",
    message:
      "The boards refresh on a schedule rather than the instant you save a session. Your points are already counted; only the display is behind.",
  },
  {
    title: "What do I win?",
    message: `The top ten of a season get Fame when it closes, from ${SEASON_FAME_REWARDS[0]} for first place to ${SEASON_FAME_REWARDS[SEASON_FAME_REWARDS.length - 1]} for tenth. The exercise of the day pays its winner a rare mod or part. Fame is spent in the Arsenal and cannot be bought.`,
  },
  {
    title: "Is a challenge recording judged?",
    message:
      "No. A recording that exists counts, played well or not. Other players can watch it, like it and comment.",
  },
  {
    title: "Can I fake a high score on the exercise of the day?",
    message:
      "A run is only scored by the microphone against the written notes, and a run longer than the exercise itself is not posted to the board at all.",
  },
  {
    title: "Is it all public?",
    message:
      "The boards show your name and score. Duel opponents stay anonymous until the duel ends, and duel runs stay off the public boards.",
  },
];
