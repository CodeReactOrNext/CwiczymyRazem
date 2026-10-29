import {
  DUEL_DURATION_MS,
  DUEL_K,
  DUEL_K_PROVISIONAL,
  DUEL_MAX_OPEN,
  DUEL_MIN_RATING,
  DUEL_PROVISIONAL_DUELS,
  DUEL_RANKING_SIZE,
  DUEL_START_RATING,
  DUEL_TICKET_TTL_MS,
} from "feature/duels/utils/duelRules";
import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";

/**
 * Feature landing for Duels (`/duels` in the app): ranked 1v1, one random
 * exercise, 48 hours, best run wins, ELO moves.
 *
 * Every rule below is read from duelRules, so the page cannot drift from the
 * server. Usage numbers are deliberately absent — duels are new (first one
 * 2026-10-13) and small counts would read as an empty room.
 */
export const DUELS_META = {
  slug: "features/guitar-duels",
  eyebrow: "Duels",
  title: "Same exercise. Two guitarists. Best run wins.",
  /** SERP title, brand included; ≤ 60 chars. */
  metaTitle: "Guitar Duels: 1v1 Practice Battles with ELO | Riff Quest",
  /** ≤ 160 chars. */
  metaDescription:
    "Get paired with a random guitarist and a random exercise. 48 hours, unlimited runs, your best one counts. Win, and your ELO rating climbs. Free.",
  publishedAt: "2026-10-29",
  updatedAt: "2026-10-29",
  /** Hand-made WebP (images.unoptimized is on), also the og:image. */
  ogImage: "/images/guitar-duels/og.webp",
} as const;

const signupThen = (path: string) => `/signup?next=${encodeURIComponent(path)}`;

export const DUELS_APP_PATH = "/duels";
export const DUELS_CTA_HREF = signupThen(DUELS_APP_PATH);
export const DUELS_RULES_ANCHOR = "what-it-is";

const hours = (ms: number) => ms / 3_600_000;

export const DUELS_NUMBERS = {
  durationHours: hours(DUEL_DURATION_MS),
  ticketHours: hours(DUEL_TICKET_TTL_MS),
  maxOpen: DUEL_MAX_OPEN,
  startRating: DUEL_START_RATING,
  minRating: DUEL_MIN_RATING,
  provisionalDuels: DUEL_PROVISIONAL_DUELS,
  kProvisional: DUEL_K_PROVISIONAL,
  k: DUEL_K,
  rankingSize: DUEL_RANKING_SIZE,
} as const;

/**
 * A real duel, settled on 2026-10-13, shown from the winner's side with
 * nobody named: the exercise, both bests, both attempt counts and both
 * ratings before and after. Both players pressed Ready.
 */
export const DUELS_REAL_DUEL = {
  date: "2026-10-13",
  exerciseId: "interval_hunt",
  you: { attempts: 4, best: 31600, ratingBefore: 1000, ratingAfter: 1019 },
  opponent: { attempts: 2, best: 5000, ratingBefore: 980, ratingAfter: 961 },
} as const;

/** What a duel is, in four lines: the idea, not the rulebook. */
export const DUELS_IDEAS = [
  {
    label: "A rival, not a schedule",
    desc: `You are paired with another guitarist and the same exercise. Each of you plays it whenever it suits you within ${hours(DUEL_DURATION_MS)} hours.`,
  },
  {
    label: "Your best run is your answer",
    desc: "Play it as often as you like. Only your best run counts, so every extra attempt is another shot at a cleaner one.",
  },
  {
    label: "Anonymous until it ends",
    desc: "You never see who you are up against or what they scored until the duel is settled. You chase your own best, not a number.",
  },
  {
    label: "A rating that follows you",
    desc: "Wins and losses move an ELO rating, the one chess made famous: beat someone better and it climbs further.",
  },
] as const;

export const DUELS_FAQS: faqQuestionInterface[] = [
  {
    title: "Is it free?",
    message:
      "Yes. Duels come with a free Riff Quest account, like the rest of the app. The only prize is rating: no items, no coins.",
  },
  {
    title: "Do I need a microphone?",
    message:
      "For the playing drills, yes: only runs scored by the microphone count. The ear-training quizzes and the click hunt on the fretboard are answered on screen, so they need none.",
  },
  {
    title: "Can I pick the exercise or the opponent?",
    message:
      "No. Both are drawn for you: the exercise at random from the duel pool, the opponent as the next player in the queue. It keeps the matchups honest.",
  },
  {
    title: "What if my opponent never plays?",
    message:
      "Then you win, as long as you played at least once. A player who never sends a run loses the duel, whatever the other side scored.",
  },
  {
    title: "Is the tempo fixed?",
    message:
      "No. You can play a drill at whatever tempo you can keep clean, and faster runs can score higher. Accuracy still decides most of it.",
  },
  {
    title: "When do I get a rating?",
    message: `Everyone starts at ${DUEL_START_RATING}, and your rating appears after your first finished duel. The top ${DUEL_RANKING_SIZE} players are listed in the duel ranking.`,
  },
];
