import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";

/**
 * Feature landing for the Learning Path (`/journey` in the app).
 *
 * Intent split: this page sells "you always know what to practise next" and
 * shows the real stages. How to use each screen lives in the wiki
 * (`journey-and-scale-tree`), mic setup in `note-detection`. Step names,
 * stage labels, counts and rewards are read from `feature/journey/data` at
 * build time, so only the copy below is written by hand.
 */
export const LEARNING_PATH_META = {
  slug: "features/guitar-learning-path",
  eyebrow: "Guitar learning path",
  title: "Always know what to practise next.",
  /** SERP title, brand included; ≤ 60 chars. */
  metaTitle: "Guitar Learning Path: Step-by-Step Modules | Riff Quest",
  /** ≤ 160 chars. */
  metaDescription:
    "Follow a guitar learning path from first melody to legato, pentatonic and bending, or map every note on the neck. One step at a time, each closed by an exam.",
  publishedAt: "2026-09-28",
  updatedAt: "2026-09-28",
  /** Hand-made WebP (images.unoptimized is on), also the og:image. */
  ogImage: "/images/learning-path/og.webp",
} as const;

/**
 * `/journey` redirects signed-out visitors to /login, which drops the
 * destination, so every CTA goes through sign-up with `next`. `?module&step`
 * opens the first step's panel straight away: the brief's "see the first
 * stage", not the module list.
 */
const signupThen = (path: string) => `/signup?next=${encodeURIComponent(path)}`;

export const LEARNING_PATH_FIRST_STEP_PATH =
  "/journey?module=fundamentals&step=step_before_you_begin";

export const LEARNING_PATH_ROUTES = {
  firstStage: signupThen(LEARNING_PATH_FIRST_STEP_PATH),
  fretboard: signupThen("/journey?module=fretboard"),
} as const;

export type LearningPathTarget = keyof typeof LEARNING_PATH_ROUTES;

/** Anchor of the stage map, linked from the hero's secondary button. */
export const LEARNING_PATH_MAP_ANCHOR = "stages";

/**
 * Who each live module is for. Keyed by module id; the test fails when a
 * module ships without a profile, so a third module can't appear on the page
 * with no one to sell it to.
 */
export const LEARNING_PATH_MODULE_COPY: Record<
  string,
  {
    forWho: string;
    outcome: string;
    image: { src: string; alt: string; width: number; height: number };
  }
> = {
  fundamentals: {
    forWho:
      "Beginners who can already hold the guitar, tune it and read a tab, and want someone else to decide the order.",
    outcome:
      "From a melody on one string to legato, the first pentatonic box and bending, then a first song to learn.",
    image: {
      src: "/images/learning-path/first-lesson.webp",
      alt: "The First Melody step of Guitar Fundamentals: the goal, two tips on fretting and pacing, and the Practice and Exam buttons",
      width: 577,
      height: 760,
    },
  },
  fretboard: {
    forWho:
      "Players who know a few shapes but can't name the note under their finger, or find the same note higher up the neck.",
    outcome:
      "Every note on every string, octaves and fret landmarks, then finding them on the guitar against the clock.",
    image: {
      src: "/images/learning-path/fretboard-lesson.webp",
      alt: "The Low E String step of Fretboard Mastery: a fretboard diagram with the notes E to A# on frets 0 to 6 of the low E string",
      width: 577,
      height: 900,
    },
  },
};

/**
 * Three objections the page itself doesn't answer. Setup and calibration
 * questions go to the note detection wiki, not here.
 */
export const LEARNING_PATH_FAQS: faqQuestionInterface[] = [
  {
    title: "Can I skip ahead to a later step?",
    message:
      "No. Steps open in order, and the next one unlocks when the one before it is complete. Both modules are open from the start, so you can work on them side by side.",
  },
  {
    title: "What happens if I fail an exam?",
    message:
      "Nothing is lost. The step stays open, you can go back to Practice, and you can retake the exam as many times as you need. A passed exam can be retaken too: a new pass replaces the earlier stars, a fail changes nothing.",
  },
  {
    title: "Does time on the Learning Path count as practice?",
    message:
      "Yes. Practice and exam sessions log like any other session, so they count towards your streak, points and statistics.",
  },
];
