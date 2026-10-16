import { existsSync } from "node:fs";
import path from "node:path";

import { getAllBlogs, getBlogBySlug } from "lib/blog";
import { extractFaqs, renderBlogContent } from "lib/blogContent";
import { describe, expect, it } from "vitest";

const slugs = [
  "fender-play-alternatives",
  "justinguitar-alternatives",
  "songsterr-alternatives",
];

describe.each(slugs)("comparison article: %s", (slug) => {
  it("loads through the public blog pipeline with usable SEO metadata", async () => {
    const { frontmatter } = await getBlogBySlug(slug);
    expect(getAllBlogs().some((blog) => blog.slug === slug)).toBe(true);
    expect(frontmatter.cluster).toBe("guitar-apps");
    expect(frontmatter.metaTitle?.length).toBeLessThanOrEqual(57);
    expect(frontmatter.description.length).toBeLessThanOrEqual(160);
    expect(
      existsSync(path.join(process.cwd(), "public", frontmatter.image)),
    ).toBe(true);
  });

  it("renders its comparison, action card and FAQs without leaking MDX", async () => {
    const { frontmatter, content } = await getBlogBySlug(slug);
    const { contentHtml, headings } = await renderBlogContent(content);
    expect(contentHtml).toContain("<table");
    expect(contentHtml).toContain('href="/guitar-practice-planner"');
    expect(contentHtml).not.toContain("<ActionCard");
    expect(contentHtml).not.toContain(":::note");
    expect(extractFaqs(content).length).toBeGreaterThanOrEqual(4);
    const numberedSections = headings.filter((heading) =>
      /^\d+\./.test(heading.text),
    );
    expect(numberedSections).toHaveLength(frontmatter.listItems?.length ?? 0);
    frontmatter.listItems?.forEach((name, index) => {
      expect(numberedSections[index].text).toContain(name);
    });
  });

  it("links only to existing local pages and published blog articles", async () => {
    const { content } = await getBlogBySlug(slug);
    const publishedSlugs = new Set(getAllBlogs().map((blog) => blog.slug));
    const links = [...content.matchAll(/\]\((\/[^)\s]+)\)/g)].map(
      (match) => match[1],
    );
    for (const href of links) {
      if (href.startsWith("/blog/")) {
        expect(publishedSlugs.has(href.slice(6)), href).toBe(true);
      } else if (href.startsWith("/wiki/")) {
        expect(
          existsSync(path.join(process.cwd(), "src/content", `${href}.md`)),
          href,
        ).toBe(true);
      } else {
        expect(
          existsSync(path.join(process.cwd(), "src/pages", `${href}.tsx`)),
          href,
        ).toBe(true);
      }
    }
  });
});
