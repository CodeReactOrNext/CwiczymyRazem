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

describe("composeGuideTitle", () => {
  it("leads with the section map, which is what the visit is for", () => {
    expect(composeGuideTitle(guideBySlug("master-of-puppets"), live(7.3, 14))).toBe(
      "Master of Puppets Guitar Difficulty: Section Map & Practice",
    );
  });

  it("keeps the longer plan wording when the song name leaves room", () => {
    expect(composeGuideTitle(guideBySlug("eruption"), live(9.4, 6))).toBe(
      "Eruption Guitar Difficulty: Section Map & Practice Plan",
    );
  });

  it("trades the section map for the rating when the name is long", () => {
    const long = {
      ...guideBySlug("master-of-puppets"),
      title: "Everything In Its Right Place",
    };
    expect(composeGuideTitle(long, live(7.3, 14))).toBe(
      "Everything In Its Right Place Guitar Difficulty: 7.3/10",
    );
  });

  it("falls all the way to the terminal variant when nothing else fits", () => {
    // Every shorter variant overruns, so the chain runs out. The last one is
    // returned over budget rather than emitting nothing — Google trims a long
    // title, but an empty one is a bug.
    const veryLong = {
      ...guideBySlug("master-of-puppets"),
      title: "Lift Your Skinny Fists Like Antennas To Heaven",
    };
    expect(composeGuideTitle(veryLong, live(7.3, 14))).toBe(
      "Lift Your Skinny Fists Like Antennas To Heaven on Guitar: Difficulty, BPM & Tuning",
    );
  });

  it("works for a song with no bpm at all", () => {
    // Nothing Else Matters is a 6/8 ballad with no single tempo in its facts.
    // The tempo variants are unavailable, so the chain lands on a rating one.
    expect(guideBySlug("nothing-else-matters").lookup?.bpm).toBeUndefined();
    expect(
      composeGuideTitle(guideBySlug("nothing-else-matters"), live(4.6, 5)),
    ).toBe("Nothing Else Matters Guitar Difficulty: 4.6/10, Section Map");
  });

  it("uses the editorial difficulty when a rating is needed and nobody has rated", () => {
    const guide = {
      ...guideBySlug("master-of-puppets"),
      title: "Everything In Its Right Place",
    };
    expect(composeGuideTitle(guide, noLive)).toContain(
      `${guide.editorial.difficulty.toFixed(1)}/10`,
    );
  });

  it("never emits a placeholder or an empty segment", () => {
    for (const guide of songGuides) {
      for (const data of [live(6.1, 12), noLive]) {
        const title = composeGuideTitle(guide, data);
        expect(title).not.toMatch(/undefined|null|NaN|N\/A/);
        expect(title).not.toMatch(/,\s*,|:\s*,|,\s*$/);
      }
    }
  });

  it("keeps every guide's title inside the budget", () => {
    for (const guide of songGuides) {
      expect(
        composeGuideTitle(guide, live(6.1, 12)).length,
        `${guide.slug} title too long`,
      ).toBeLessThanOrEqual(60);
    }
  });
});

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
