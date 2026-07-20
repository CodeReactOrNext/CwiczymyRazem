import { SEO_LANDING_PAGES } from "lib/exerciseLandingLink";
import { describe, expect, it } from "vitest";

import { getSongGuideBySlug, songGuides } from "./index";

describe("song guides content", () => {
  it("has unique slugs", () => {
    const slugs = songGuides.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("resolves guides by slug", () => {
    songGuides.forEach((guide) => {
      expect(getSongGuideBySlug(guide.slug)).toBe(guide);
    });
  });

  it("keeps meta titles within SERP-friendly length", () => {
    songGuides.forEach((guide) => {
      expect(guide.seo.metaTitle.length).toBeLessThanOrEqual(65);
      expect(guide.seo.metaDescription.length).toBeGreaterThan(50);
    });
  });

  it("has enough FAQ entries for a FAQPage rich result", () => {
    songGuides.forEach((guide) => {
      expect(guide.faq.length).toBeGreaterThanOrEqual(4);
      guide.faq.forEach((entry) => {
        expect(entry.title.length).toBeGreaterThan(0);
        expect(entry.message.length).toBeGreaterThan(40);
      });
    });
  });

  it("keeps difficulties on the 1-10 community scale", () => {
    songGuides.forEach((guide) => {
      expect(guide.editorial.difficulty).toBeGreaterThan(0);
      expect(guide.editorial.difficulty).toBeLessThanOrEqual(10);
      guide.songMap?.sections.forEach((section) => {
        expect(section.difficulty).toBeGreaterThan(0);
        expect(section.difficulty).toBeLessThanOrEqual(10);
      });
      guide.learningPath.easier
        .concat(guide.learningPath.harder)
        .forEach((song) => {
          expect(song.difficulty).toBeGreaterThan(0);
          expect(song.difficulty).toBeLessThanOrEqual(10);
        });
    });
  });

  it("only orders sections that exist", () => {
    songGuides.forEach((guide) => {
      const customIds = new Set(
        guide.customBlocks.map((block) => `custom:${block.id}`)
      );
      guide.sectionOrder.forEach((sectionId) => {
        if (sectionId.startsWith("custom:")) {
          expect(customIds.has(sectionId), `${guide.slug} -> ${sectionId}`).toBe(
            true
          );
        }
        if (sectionId === "songMap") {
          expect(guide.songMap, `${guide.slug} orders songMap`).toBeDefined();
        }
        if (sectionId === "relatedExercises") {
          expect(
            guide.relatedLandingSlugs.length,
            `${guide.slug} orders relatedExercises with no relatedLandingSlugs`
          ).toBeGreaterThan(0);
        }
      });
    });
  });

  it("points relatedLandingSlugs at real SEO landing pages", () => {
    const validKeys = new Set(Object.keys(SEO_LANDING_PAGES));
    songGuides.forEach((guide) => {
      guide.relatedLandingSlugs.forEach((key) => {
        expect(validKeys.has(key), `${guide.slug} -> "${key}"`).toBe(true);
      });
      if (guide.relatedLandingSlugs.length > 0) {
        expect(
          guide.sectionOrder.includes("relatedExercises"),
          `${guide.slug} has relatedLandingSlugs but never renders them`
        ).toBe(true);
      }
    });
  });

  it("renders every custom block it defines", () => {
    songGuides.forEach((guide) => {
      guide.customBlocks.forEach((block) => {
        expect(
          guide.sectionOrder.includes(`custom:${block.id}`),
          `${guide.slug} misses custom:${block.id}`
        ).toBe(true);
      });
    });
  });

  it("cross-links only to existing guides", () => {
    const slugs = new Set(songGuides.map((g) => g.slug));
    songGuides.forEach((guide) => {
      guide.learningPath.easier
        .concat(guide.learningPath.harder)
        .forEach((song) => {
          if (song.guideSlug) {
            expect(slugs.has(song.guideSlug), `${guide.slug} -> ${song.guideSlug}`).toBe(true);
            expect(song.guideSlug).not.toBe(guide.slug);
          }
        });
    });
  });

  it("gives every guide a unique section order", () => {
    const orders = songGuides.map((g) => g.sectionOrder.join(","));
    expect(new Set(orders).size).toBe(orders.length);
  });
});
