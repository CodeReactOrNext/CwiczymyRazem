import { getSongGuideBySlug } from "feature/song-library/song-guides/content";
import type { SongGuide } from "feature/song-library/song-guides/types";

/**
 * The song guides linked from the landing page's "Popular guides" strip,
 * curated rather than sliced off the registry: the point of the strip is to
 * show the whole ladder, so keep it ordered easiest → hardest and keep at
 * least one guide from the bottom and one from the top tier.
 */
export const FEATURED_GUIDE_SLUGS = [
  "smoke-on-the-water",
  "wish-you-were-here",
  "seven-nation-army",
  "nothing-else-matters",
  "thunderstruck",
  "stairway-to-heaven",
  "master-of-puppets",
  "eruption",
] as const;

/** Resolved guides, silently skipping any slug that no longer exists. */
export const featuredGuides: SongGuide[] = FEATURED_GUIDE_SLUGS.map((slug) =>
  getSongGuideBySlug(slug),
).filter((guide): guide is SongGuide => Boolean(guide));

/**
 * What the landing strip renders, resolved in getStaticProps. The strip must not
 * import the guide registry itself: that pulled the full text of every guide
 * (~450 KB) into the home page bundle.
 */
export interface FeaturedGuideLink {
  slug: string;
  title: string;
  songId: string | null;
  editorialDifficulty: number;
}

export const featuredGuideLinks: FeaturedGuideLink[] = featuredGuides.map(
  (guide) => ({
    slug: guide.slug,
    title: guide.title,
    songId: guide.songId ?? null,
    editorialDifficulty: guide.editorial.difficulty,
  }),
);

/** Firestore ids to hydrate with live ratings for the strip's tier badges. */
export const featuredGuideSongIds: string[] = featuredGuides
  .map((guide) => guide.songId)
  .filter((id): id is string => Boolean(id));
