import { readdirSync, readFileSync } from "fs";
import { extractFaqs, renderBlogContent } from "lib/blogContent";
import { join } from "path";
import { describe, expect, it } from "vitest";

/**
 * The 2026-09-05 audit found 33 table-of-contents links across five posts with
 * no matching id in the HTML: the contents list was hand-maintained, `###`
 * headings never got an id at all, and headings containing links slugged
 * differently on each side. This renders every post and checks the anchors.
 */

const BLOG_DIR = join(__dirname, "../content/blog");

const posts = readdirSync(BLOG_DIR)
  .filter((file) => /\.mdx?$/.test(file))
  .map((file) => ({
    file,
    content: readFileSync(join(BLOG_DIR, file), "utf8").replace(
      /^---\r?\n[\s\S]*?\r?\n---\r?\n/,
      ""
    ),
  }));

const idsIn = (html: string) =>
  new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));

describe.each(posts)("$file", ({ content }) => {
  it("gives every table-of-contents entry a heading that carries its id", async () => {
    const { contentHtml, headings } = await renderBlogContent(content);
    const rendered = idsIn(contentHtml);

    const missing = headings
      .map((heading) => heading.id)
      .filter((id) => !rendered.has(id));

    expect(missing).toEqual([]);
  });

  it("resolves every in-page anchor written in the article body", async () => {
    const { contentHtml } = await renderBlogContent(content);
    const rendered = idsIn(contentHtml);

    const anchors = [...content.matchAll(/\]\(#([^)\s]+)\)/g)].map(
      (match) => match[1]
    );

    const broken = anchors.filter((anchor) => !rendered.has(anchor));

    expect(broken).toEqual([]);
  });

  it("has no leftover hand-written table of contents", () => {
    expect(content).not.toMatch(/^## Table of Contents/m);
  });

  it("declares FAQs in markdown rather than inline FAQPage microdata", () => {
    expect(content).not.toContain("schema.org/FAQPage");
  });

  it("stops each FAQ answer at its own section", () => {
    // The extractor used to take everything after the last `###` to the end of
    // the file, so a conclusion following the FAQ block landed inside the last
    // answer in the FAQPage schema.
    for (const faq of extractFaqs(content)) {
      expect(faq.answer, faq.question).not.toContain("## ");
    }
  });
});

describe("extractFaqs", () => {
  it("ignores whatever follows the FAQ section", () => {
    const faqs = extractFaqs(
      [
        "## FAQs",
        "",
        "### Does it stop?",
        "",
        "Yes, at the next h2.",
        "",
        "## Conclusion",
        "",
        "This paragraph belongs to no answer.",
      ].join("\n")
    );

    expect(faqs).toEqual([
      { question: "Does it stop?", answer: "Yes, at the next h2." },
    ]);
  });

  it("returns nothing for a post with no FAQ section", () => {
    expect(extractFaqs("## Something else\n\nBody.")).toEqual([]);
  });
});
