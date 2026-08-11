import { evaluate } from "@mdx-js/mdx";
import { BlogAlert } from "components/Blog/BlogAlert";
import { Checklist } from "components/Blog/Checklist";
import { StatRow } from "components/Blog/StatRow";
import { StepList } from "components/Blog/StepList";
import {
  AppScreen,
  BoardPreview,
  ClickPath,
  FaqList,
  PlanComparison,
  ProgressLadder,
  QuestPreview,
  ReadNext,
  SessionLogPreview,
  TierScale,
} from "components/Wiki";
import { getAllWikiPages, getWikiPageBySlug } from "lib/wiki";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";

const components = {
  StepList,
  Checklist,
  StatRow,
  BlogAlert,
  AppScreen,
  BoardPreview,
  ClickPath,
  FaqList,
  PlanComparison,
  ProgressLadder,
  QuestPreview,
  ReadNext,
  SessionLogPreview,
  TierScale,
};

const pages = getAllWikiPages();

/**
 * Wiki articles are markdown-with-components rendered on the server. A typo in a
 * component name or a missing prop only shows up when the page is requested, so
 * every article gets compiled and rendered here instead.
 */
describe("wiki content", () => {
  it("finds the articles", () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  it.each(pages.map((page) => page.slug))("renders %s", async (slug) => {
    const { frontmatter, content } = await getWikiPageBySlug(slug);

    expect(frontmatter.title).toBeTruthy();
    expect(frontmatter.description).toBeTruthy();
    expect(frontmatter.section).toBeTruthy();

    const { default: MDXContent } = await evaluate(content, {
      ...jsxRuntime,
      remarkPlugins: [remarkGfm],
    });

    expect(renderToStaticMarkup(<MDXContent components={components} />)).not.toBe("");
  });

  it("only links to wiki articles that exist", async () => {
    const slugs = new Set(pages.map((page) => page.slug));

    for (const page of pages) {
      const { content } = await getWikiPageBySlug(page.slug);
      const links = content.match(/\/wiki\/[a-z0-9-]+/g) ?? [];

      for (const link of links) {
        expect(slugs, `${page.slug} links to ${link}`).toContain(
          link.replace("/wiki/", "")
        );
      }
    }
  });
});
