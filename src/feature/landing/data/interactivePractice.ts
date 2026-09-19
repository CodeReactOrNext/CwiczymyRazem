import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";

/**
 * Copy for the /interactive-guitar-practice landing: the product-feature page
 * for practising with live note feedback (Pitch Detect).
 *
 * Intent split agreed in the 2026-09-19 duplication review: the homepage says
 * what Riff Quest is, this page shows what a session with note feedback looks
 * like and where to start one, and the wiki owns setup, calibration and
 * troubleshooting. Keep it that way — a long mic-setup section or a fourth
 * FAQ about hardware belongs in `src/content/wiki/note-detection.md`, not here.
 */
export const INTERACTIVE_PRACTICE_META = {
  slug: "interactive-guitar-practice",
  title: "Interactive guitar practice with real-time note feedback",
  /** SERP title, brand included; ≤ 60 chars. */
  metaTitle: "Interactive Guitar Practice: Live Note Feedback | Riff Quest",
  /** ≤ 160 chars. */
  metaDescription:
    "Play a real exercise while the tab scrolls at your tempo and Pitch Detect marks every note as a hit or a miss. Works with a mic or an audio interface. Free.",
  publishedAt: "2026-09-19",
  updatedAt: "2026-09-19",
  /** Hero backdrop, also the og:image. Hand-made WebP, see docs on images.unoptimized. */
  ogImage: "/images/interactive-practice/og.webp",
} as const;

/** The drill in every screenshot on the page, embedded as real notation. */
export const INTERACTIVE_PRACTICE_DEMO_EXERCISE_ID = "chromatic_accents";

/**
 * Where "Start" buttons send a visitor: sign-up first (the practice route
 * redirects signed-out users to /login), then straight into the demo drill via
 * the `next` query that the sign-up form honours.
 */
export const INTERACTIVE_PRACTICE_START_HREF = `/signup?next=${encodeURIComponent(
  "/practice/exercise/chromatic-accents",
)}`;

/**
 * Three questions about the feedback itself. Account, pricing and general
 * hardware questions stay on /faq; calibration and "it hears nothing" stay in
 * the wiki.
 */
export const INTERACTIVE_PRACTICE_FAQS: faqQuestionInterface[] = [
  {
    title: "Do I need an audio interface for note feedback?",
    message:
      "No. A built-in laptop microphone works for an acoustic guitar or an amp in the room. An audio interface gives a cleaner signal and fewer missed notes on fast or distorted passages, so use one if you already own it.",
  },
  {
    title: "Does the app judge how good my playing sounds?",
    message:
      "No. It matches the pitch it hears against the note that was due and marks a hit or a miss. Tone, timing feel and dynamics are not measured, so a clean-sounding wrong note is a miss and a buzzy right note is a hit. Treat the score as a second opinion on wrong notes, not a verdict on your playing.",
  },
  {
    title: "Is my audio recorded or sent anywhere?",
    message:
      "Pitch detection runs on your computer, in the browser or in the desktop app, and does not record or upload anything. Recording a take is a separate feature you start yourself.",
  },
];
