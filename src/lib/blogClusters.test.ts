import { describe, expect, it } from "vitest";

import { getAllBlogs } from "./blog";
import {
  CLUSTER_PRACTICE_LINK,
  getPracticeLink,
  POST_PRACTICE_LINK,
} from "./internalLinks";

/**
 * A hub-and-spoke cluster only does anything when it has more than one post in
 * it: `pillar: true` on an article with no spokes is a label, not a structure.
 * The blog carried eight clusters over eleven posts, five of them single-post,
 * and CLUSTER_PRACTICE_LINK still listed ten clusters that no post used
 * (SEO audit 2026-09-16).
 */

const blogs = getAllBlogs();

const byCluster = blogs.reduce<Record<string, typeof blogs>>((acc, blog) => {
  if (!blog.cluster) return acc;
  (acc[blog.cluster] ??= []).push(blog);
  return acc;
}, {});

describe("blog topic clusters", () => {
  it("gives every post a cluster", () => {
    const orphans = blogs.filter((blog) => !blog.cluster).map((b) => b.slug);
    expect(orphans).toEqual([]);
  });

  it("has no single-post cluster", () => {
    const lonely = Object.entries(byCluster)
      .filter(([, posts]) => posts.length < 2)
      .map(([cluster]) => cluster);
    expect(lonely).toEqual([]);
  });

  it("has exactly one pillar per cluster", () => {
    for (const [cluster, posts] of Object.entries(byCluster)) {
      const pillars = posts.filter((post) => post.pillar).map((p) => p.slug);
      expect(pillars, `cluster "${cluster}"`).toHaveLength(1);
    }
  });

  it("resolves a practice link for every post", () => {
    for (const blog of blogs) {
      expect(
        getPracticeLink(blog.slug, blog.cluster),
        `no practice link for "${blog.slug}"`,
      ).not.toBeNull();
    }
  });

  it("keeps the practice-link maps free of dead entries", () => {
    const liveClusters = new Set(Object.keys(byCluster));
    const liveSlugs = new Set(blogs.map((blog) => blog.slug));

    expect(
      Object.keys(CLUSTER_PRACTICE_LINK).filter((c) => !liveClusters.has(c)),
    ).toEqual([]);
    expect(
      Object.keys(POST_PRACTICE_LINK).filter((s) => !liveSlugs.has(s)),
    ).toEqual([]);
  });

  it("spreads the practice links across every landing page", () => {
    // Each of the five guides should be the "put this into practice" target of
    // at least one post, or it gets no link from the blog at all.
    const targets = new Set(
      blogs.map((blog) => getPracticeLink(blog.slug, blog.cluster)?.href),
    );
    for (const href of [
      "/beginner-guitar-exercises",
      "/daily-guitar-practice-plan",
      "/guitar-scale-practice-routine",
      "/guitar-speed-hand-synchronization-exercises",
      "/intermediate-guitar-practice-routine",
    ]) {
      expect(targets.has(href), `no post points at ${href}`).toBe(true);
    }
  });
});
