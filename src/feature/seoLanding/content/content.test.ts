import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { idToSlug } from "feature/exercises/lib/slugUtils";
import { songGuides } from "feature/song-library/song-guides/content";
import { getAllBlogs } from "lib/blog";
import { getExerciseLandingHref, SEO_LANDING_PAGES } from "lib/exerciseLandingLink";
import { describe, expect, it } from "vitest";

import { collectExerciseIds } from "../lib/collectExerciseIds";
import { headingId } from "../lib/headingId";
import { seoLandingConfigs } from "./index";

const INTERNAL_LINK_PATTERN = /\]\((\/[^)\s#]*|#[^)\s]+)/g;

const internalLinksOf = (value: unknown): string[] => {
  const links: string[] = [];
  const text = JSON.stringify(value);
  let match: RegExpExecArray | null;
  const pattern = new RegExp(INTERNAL_LINK_PATTERN);
  while ((match = pattern.exec(text))) {
    links.push(match[1]);
  }
  return links;
};

describe("SEO landing content configs", () => {
  it("covers exactly the five landing URLs", () => {
    const slugs = seoLandingConfigs.map((config) => config.slug).sort();
    expect(slugs).toEqual(
      Object.values(SEO_LANDING_PAGES)
        .map((path) => path.slice(1))
        .sort()
    );
  });

  it("references only existing exercise ids, each on a single page", () => {
    const seen = new Map<string, string>();
    for (const config of seoLandingConfigs) {
      for (const id of collectExerciseIds(config)) {
        const exercise = exercisesAgregat.find((ex) => ex.id === id);
        expect(exercise, `unknown exercise "${id}" on ${config.slug}`).toBeTruthy();
        expect(
          seen.has(id),
          `exercise "${id}" embedded on both ${seen.get(id)} and ${config.slug}`
        ).toBe(false);
        seen.set(id, config.slug);
      }
    }
  });

  it("keeps SERP metadata within limits", () => {
    for (const config of seoLandingConfigs) {
      expect(
        config.metaTitle.length,
        `metaTitle too long on ${config.slug}`
      ).toBeLessThanOrEqual(60);
      expect(
        config.metaDescription.length,
        `metaDescription too long on ${config.slug}`
      ).toBeLessThanOrEqual(160);
      expect(config.faqs.length, `no FAQs on ${config.slug}`).toBeGreaterThan(2);
      expect(config.intro.length).toBeGreaterThan(0);
      expect(config.sections.length).toBeGreaterThan(2);
    }
  });

  it("cross-links only to existing guides, blog posts and song guides", () => {
    const guideSlugs = new Set(seoLandingConfigs.map((config) => config.slug));
    const blogSlugs = new Set(getAllBlogs().map((blog) => blog.slug));
    const songGuideSlugs = new Set(songGuides.map((guide) => guide.slug));
    for (const config of seoLandingConfigs) {
      for (const slug of config.relatedGuideSlugs) {
        expect(guideSlugs.has(slug), `unknown guide "${slug}" on ${config.slug}`).toBe(
          true
        );
        expect(slug).not.toBe(config.slug);
      }
      for (const slug of config.relatedBlogSlugs) {
        expect(blogSlugs.has(slug), `unknown blog "${slug}" on ${config.slug}`).toBe(
          true
        );
      }
      for (const slug of config.relatedSongGuideSlugs) {
        expect(
          songGuideSlugs.has(slug),
          `unknown song guide "${slug}" on ${config.slug}`
        ).toBe(true);
      }
      for (const link of internalLinksOf(config)) {
        if (link.startsWith("/blog/")) {
          expect(
            blogSlugs.has(link.slice("/blog/".length)),
            `dead blog link "${link}" on ${config.slug}`
          ).toBe(true);
        }
      }
    }
  });

  it("resolves every in-page anchor to a heading or embedded exercise", () => {
    for (const config of seoLandingConfigs) {
      const anchors = new Set<string>([
        ...config.sections.map((section) => headingId(section.heading)),
        headingId("FAQ"),
        ...collectExerciseIds(config).map(idToSlug),
      ]);
      for (const link of internalLinksOf(config)) {
        if (!link.startsWith("#")) continue;
        expect(
          anchors.has(link.slice(1)),
          `dead anchor "${link}" on ${config.slug}`
        ).toBe(true);
      }
    }
  });

  it("keeps lib/exerciseLandingLink embedded map in sync with the configs", () => {
    for (const config of seoLandingConfigs) {
      for (const id of collectExerciseIds(config)) {
        expect(
          getExerciseLandingHref(id),
          `getExerciseLandingHref("${id}") should deep-link into ${config.slug}`
        ).toBe(`/${config.slug}#${idToSlug(id)}`);
      }
    }
  });
});
