export interface SeoLandingFaq {
  question: string;
  answer: string;
}

export interface SeoLandingSchedule {
  title?: string;
  columns: string[];
  rows: string[][];
}

export type SeoLandingBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "tip"; title?: string; text: string }
  | { kind: "cta"; title: string; text: string }
  | { kind: "exercise"; exerciseId: string; commentary: string[] }
  | { kind: "schedule"; schedule: SeoLandingSchedule };

export interface SeoLandingSection {
  heading: string;
  blocks: SeoLandingBlock[];
}

export interface SeoLandingConfig {
  /** Root-level URL slug, e.g. "beginner-guitar-exercises". */
  slug: string;
  /** H1 — targets the primary keyword of the page. */
  title: string;
  /** SERP title; keep ≤ 60 chars, brand appended automatically when short. */
  metaTitle: string;
  /** SERP description; keep ≤ 160 chars. */
  metaDescription: string;
  publishedAt: string;
  updatedAt: string;
  /** Hero paragraphs — answer the search intent in the first two sentences. */
  intro: string[];
  sections: SeoLandingSection[];
  faqs: SeoLandingFaq[];
  /** Slugs of the other SEO landing pages to cross-link. */
  relatedGuideSlugs: string[];
  /** Blog post slugs (src/content/blog) surfaced as further reading. */
  relatedBlogSlugs: string[];
  /** Song guide slugs (feature/song-library/song-guides) that put these exercises to work in a real song. */
  relatedSongGuideSlugs: string[];
}

export interface SeoLandingGuideLink {
  slug: string;
  title: string;
  description: string;
}

export interface SeoLandingSongGuideLink {
  slug: string;
  title: string;
  artist: string;
  description: string;
}
