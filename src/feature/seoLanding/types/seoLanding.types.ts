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
  | {
      kind: "cta";
      title: string;
      text: string;
      ctaLabel?: string;
      /** Optional session preview beside the copy: block name + minutes. */
      plan?: { label: string; minutes: number }[];
      planTitle?: string;
    }
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
  /**
   * Author name resolved through `lib/authors`. Renders a byline in the hero,
   * an AuthorBio below the FAQ, and a Person (rather than Organization) author
   * in the Article JSON-LD. Omit to stay organization-authored.
   */
  author?: string;
  /**
   * Full-bleed photo behind the hero copy. Also becomes the page's og:image
   * and the Article JSON-LD image, so each guide gets its own social preview
   * instead of the shared og-image.png. `images.unoptimized` is on, so ship a
   * hand-made WebP at roughly the width it renders — Next will not resize it.
   * Width/height feed the og tags; the hero itself uses `fill`.
   */
  heroImage?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  /**
   * Optional chips in the hero that jump straight to a section, for pages whose
   * whole point is choosing between variants — "15 / 30 / 60 minutes" on the
   * daily plan. `heading` must match a section heading exactly.
   */
  quickPicks?: { label: string; heading: string }[];
  /** Prompt above the quick-pick chips. Defaults to the session-length question. */
  quickPicksTitle?: string;
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
