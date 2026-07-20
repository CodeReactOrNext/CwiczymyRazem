import type { ExerciseCategory } from 'feature/exercisePlan/types/exercise.types';
import { SEO_LANDING_PAGES } from 'lib/exerciseLandingLink';

export interface PracticeLink {
  href: string;
  label: string;
  /** Set when the link points at a specific exercise category, so callers can
   *  also surface a few sample exercises from that category. */
  exerciseCategory?: ExerciseCategory;
}

/**
 * Where a blog post's reader should go next to put the article into practice.
 * Keyed by the post's frontmatter `cluster` (see lib/blog.ts).
 */
export const CLUSTER_PRACTICE_LINK: Record<string, PracticeLink> = {
  'guitar-technique': { href: SEO_LANDING_PAGES.speed, label: 'Speed & Hand Sync Exercises', exerciseCategory: 'technique' },
  'guitar-fundamentals': { href: SEO_LANDING_PAGES.scales, label: 'Scale Practice Routine', exerciseCategory: 'theory' },
  'deliberate-practice': { href: SEO_LANDING_PAGES.intermediate, label: 'Intermediate Practice Routine', exerciseCategory: 'technique' },
  'guitar-learning-path': { href: SEO_LANDING_PAGES.beginner, label: 'Beginner Guitar Exercises' },
  'practice-routine': { href: SEO_LANDING_PAGES.daily, label: 'Daily Practice Plan' },
  'practice-time': { href: SEO_LANDING_PAGES.daily, label: 'Daily Practice Plan' },
  'improvement-plateau': { href: SEO_LANDING_PAGES.intermediate, label: 'Intermediate Practice Routine' },
  'learn-guitar-faster': { href: SEO_LANDING_PAGES.beginner, label: 'Beginner Guitar Exercises' },
  'guitar-repertoire': { href: '/song-library', label: 'Song Library' },
  'song-difficulty': { href: '/song-library', label: 'Song Library' },
  'progress-tracking': { href: '/how-it-works', label: 'How Riff Quest Tracks Progress' },
  'practice-goals': { href: '/how-it-works', label: 'How It Works' },
  'guitar-apps': { href: '/how-it-works', label: 'How It Works' },
};
