import type { ExerciseCategory } from "feature/exercisePlan/types/exercise.types";
import { SEO_LANDING_PAGES } from "lib/exerciseLandingLink";

export interface PracticeLink {
  href: string;
  label: string;
  /** Set when the link points at a specific exercise category, so callers can
   *  also surface a few sample exercises from that category. */
  exerciseCategory?: ExerciseCategory;
}

/**
 * Where a blog post's reader should go next to put the article into practice.
 *
 * Two layers, because a cluster is broader than a post: CLUSTER_PRACTICE_LINK
 * is the fallback for a whole topic, POST_PRACTICE_LINK overrides it for a
 * single article. Keeping only the cluster layer sent every post in the
 * five-strong practice-routine cluster to the same landing page and left two
 * of the five guides with no blog-side link at all (SEO audit 2026-09-16).
 */

/** Keyed by the post's frontmatter `cluster` (see lib/blog.ts). */
export const CLUSTER_PRACTICE_LINK: Record<string, PracticeLink> = {
  "practice-routine": {
    href: SEO_LANDING_PAGES.daily,
    label: "Daily Practice Plan",
  },
  "guitar-technique": {
    href: SEO_LANDING_PAGES.speed,
    label: "Speed & Hand Sync Exercises",
    exerciseCategory: "technique",
  },
  "song-difficulty": { href: "/song-library", label: "Song Library" },
  "guitar-apps": { href: "/how-it-works", label: "How It Works" },
};

/** Keyed by blog slug; wins over the post's cluster entry. */
export const POST_PRACTICE_LINK: Record<string, PracticeLink> = {
  "beginner-guitar-practice-checklist-daily-essentials": {
    href: SEO_LANDING_PAGES.beginner,
    label: "Beginner Guitar Exercises",
  },
  "guitar-chords-for-beginners": {
    href: SEO_LANDING_PAGES.beginner,
    label: "Beginner Guitar Exercises",
  },
  "how-to-practice-guitar-scales-effectively": {
    href: SEO_LANDING_PAGES.scales,
    label: "Scale Practice Routine",
    exerciseCategory: "theory",
  },
  "practice-guitar-every-day-simple-steps": {
    href: SEO_LANDING_PAGES.speed,
    label: "Speed & Hand Sync Exercises",
    exerciseCategory: "technique",
  },
  "how-long-practice-guitar-daily": {
    href: SEO_LANDING_PAGES.intermediate,
    label: "Intermediate Practice Routine",
    exerciseCategory: "technique",
  },
  "how-to-track-guitar-practice-progress-effectively": {
    href: "/how-it-works",
    label: "How Riff Quest Tracks Progress",
  },
};

/** The practice link for a post, or null when neither layer covers it. */
export const getPracticeLink = (
  slug: string,
  cluster?: string,
): PracticeLink | null =>
  POST_PRACTICE_LINK[slug] ??
  (cluster ? CLUSTER_PRACTICE_LINK[cluster] ?? null : null);
