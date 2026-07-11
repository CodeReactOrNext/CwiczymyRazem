import type { ExerciseCategory } from 'feature/exercisePlan/types/exercise.types';

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
  'guitar-technique': { href: '/exercises/category/technique', label: 'Technique Exercises', exerciseCategory: 'technique' },
  'guitar-fundamentals': { href: '/exercises/category/theory', label: 'Theory Exercises', exerciseCategory: 'theory' },
  'deliberate-practice': { href: '/exercises/category/technique', label: 'Technique Exercises', exerciseCategory: 'technique' },
  'guitar-learning-path': { href: '/exercises', label: 'Exercise Library' },
  'practice-routine': { href: '/exercises', label: 'Exercise Library' },
  'practice-time': { href: '/exercises', label: 'Exercise Library' },
  'improvement-plateau': { href: '/exercises', label: 'Exercise Library' },
  'learn-guitar-faster': { href: '/exercises', label: 'Exercise Library' },
  'guitar-repertoire': { href: '/song-library', label: 'Song Library' },
  'song-difficulty': { href: '/song-library', label: 'Song Library' },
  'progress-tracking': { href: '/how-it-works', label: 'How Riff Quest Tracks Progress' },
  'practice-goals': { href: '/how-it-works', label: 'How It Works' },
  'guitar-apps': { href: '/how-it-works', label: 'How It Works' },
};

/** Reverse of the map above: which blog clusters are worth surfacing as
 *  further reading for a given exercise category. */
export const CATEGORY_TO_BLOG_CLUSTERS: Record<ExerciseCategory, string[]> = {
  technique: ['guitar-technique', 'deliberate-practice', 'improvement-plateau'],
  theory: ['guitar-fundamentals'],
  hearing: ['guitar-fundamentals'],
  creativity: ['guitar-repertoire'],
  mixed: [],
};
