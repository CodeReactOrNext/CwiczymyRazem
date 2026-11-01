import { songGuides } from "feature/song-library/song-guides/content";
import type { GuideLiveData, SongGuide } from "feature/song-library/song-guides/types";
import { describe, expect, it } from "vitest";

import { composeGuideDescription, composeGuideTitle } from "./composeGuideSeo";

const guideBySlug = (slug: string): SongGuide => {
  const guide = songGuides.find((entry) => entry.slug === slug);
  if (!guide) throw new Error(`no guide for ${slug}`);
  return guide;
};

const live = (
  avgDifficulty: number,
  ratingsCount: number,
): GuideLiveData => ({
  song: {
    avgDifficulty,
    ratingsCount,
    tier: "S",
    popularity: 0,
    coverUrl: null,
  },
});

const noLive: GuideLiveData = { song: null };

describe("composeGuideDescription", () => {
  it("names the rater count only when there are real ratings", () => {
    const withRatings = composeGuideDescription(
      guideBySlug("master-of-puppets"),
      live(7.3, 14),
    );
    expect(withRatings).toContain("Rated 7.3/10 by 14 guitarists who learned it.");

    const without = composeGuideDescription(guideBySlug("master-of-puppets"), noLive);
    expect(without).not.toMatch(/Rated|guitarists/);
  });

  it("singularises a lone rating", () => {
    expect(
      composeGuideDescription(guideBySlug("master-of-puppets"), live(8, 1)),
    ).toContain("by 1 guitarist who");
  });

  it("omits the key clause for songs with no single key", () => {
    expect(guideBySlug("thunderstruck").lookup?.musicalKey).toBeUndefined();
    const description = composeGuideDescription(
      guideBySlug("thunderstruck"),
      live(6.4, 8),
    );
    expect(description).toContain("136 BPM, E standard tuning.");
    expect(description).not.toMatch(/\bin\s*,/);
  });

  it("never emits a placeholder and stays inside the budget", () => {
    for (const guide of songGuides) {
      for (const data of [live(6.1, 12), noLive]) {
        const description = composeGuideDescription(guide, data);
        expect(description).not.toMatch(/undefined|null|NaN|N\/A/);
        expect(description).not.toMatch(/,\s*,|:\s*\./);
        expect(
          description.length,
          `${guide.slug} description too long`,
        ).toBeLessThanOrEqual(155);
      }
    }
  });
});

describe("composeGuideTitle", () => {
  it("answers the 'is it hard' question with the community score", () => {
    expect(composeGuideTitle(guideBySlug("master-of-puppets"), live(7.46, 19))).toBe(
      "Is Master of Puppets Hard to Play on Guitar? Rated 7.5/10",
    );
  });

  it("keeps the hand-written title when ratings are missing or thin", () => {
    const guide = guideBySlug("master-of-puppets");
    expect(composeGuideTitle(guide, noLive)).toBe(guide.seo.metaTitle);
    expect(composeGuideTitle(guide, live(7, 4))).toBe(guide.seo.metaTitle);
  });

  it("stays inside the title budget for every guide", () => {
    for (const guide of songGuides) {
      expect(composeGuideTitle(guide, live(10, 99)).length).toBeLessThanOrEqual(
        Math.max(65, guide.seo.metaTitle.length),
      );
    }
  });
});
