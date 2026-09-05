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

/** Firestore ids to hydrate with live ratings for the strip's tier badges. */
export const featuredGuideSongIds: string[] = featuredGuides
  .map((guide) => guide.songId)
  .filter((id): id is string => Boolean(id));
