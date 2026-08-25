import { songGuides } from "feature/song-library/song-guides/content";
import { describe, expect, it } from "vitest";

import { FEATURED_GUIDE_SLUGS, featuredGuides } from "./featuredGuides";

describe("landing featured guides", () => {
  it("points every slug at a guide that exists", () => {
    const slugs = new Set(songGuides.map((guide) => guide.slug));
    FEATURED_GUIDE_SLUGS.forEach((slug) => {
      expect(slugs.has(slug), `unknown guide "${slug}"`).toBe(true);
    });
    expect(featuredGuides).toHaveLength(FEATURED_GUIDE_SLUGS.length);
  });

  it("lists them easiest first", () => {
    const difficulties = featuredGuides.map(
      (guide) => guide.editorial.difficulty,
    );
    expect(difficulties).toEqual([...difficulties].sort((a, b) => a - b));
  });

  it("spans the ladder from a beginner song to an advanced one", () => {
    const difficulties = featuredGuides.map(
      (guide) => guide.editorial.difficulty,
    );
    expect(Math.min(...difficulties)).toBeLessThanOrEqual(4);
    expect(Math.max(...difficulties)).toBeGreaterThanOrEqual(8);
  });
});
