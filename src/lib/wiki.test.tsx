// @vitest-environment jsdom

import { evaluate } from "@mdx-js/mdx";
import { BlogAlert } from "components/Blog/BlogAlert";
import { Checklist } from "components/Blog/Checklist";
import { SongTierTable } from "components/Blog/SongTierTable";
import { StatRow } from "components/Blog/StatRow";
import { StepList } from "components/Blog/StepList";
import { YouTube } from "components/Blog/YouTube";
import { currencyProseComponents } from "components/CurrencyIcons/withCurrencyIcons";
import {
  AppScreen,
  BoardPreview,
  ClickPath,
  FaqList,
  ProgressLadder,
  QuestPreview,
  ReadNext,
  Screenshot,
  SessionLogPreview,
  TierScale,
} from "components/Wiki";
import fs from "fs";
import type { AppLocale } from "lib/i18n/locales";
import {
  getAllWikiPages,
  getWikiPageBySlug,
  hasWikiTranslation,
} from "lib/wiki";
import path from "path";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";

const components = {
  ...currencyProseComponents,
  StepList,
  Checklist,
  StatRow,
  SongTierTable,
  BlogAlert,
  AppScreen,
  BoardPreview,
  ClickPath,
  FaqList,
  ProgressLadder,
  QuestPreview,
  ReadNext,
  Screenshot,
  SessionLogPreview,
  TierScale,
  YouTube,
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

    expect(
      renderToStaticMarkup(<MDXContent components={components} />),
    ).not.toBe("");
  });

  it("only links to wiki articles that exist", async () => {
    const slugs = new Set(pages.map((page) => page.slug));

    for (const page of pages) {
      const { content } = await getWikiPageBySlug(page.slug);
      // Screenshots live in `public/images/wiki/`, so a bare `/wiki/…` match also
      // catches the tail of every image path — hence the lookbehind.
      const links = content.match(/(?<!\/images)\/wiki\/[a-z0-9-]+/g) ?? [];

      for (const link of links) {
        expect(slugs, `${page.slug} links to ${link}`).toContain(
          link.replace("/wiki/", ""),
        );
      }
    }
  });

  /**
   * A screenshot path that doesn't resolve renders as a broken image and nothing
   * else — no error, no failed build. Cheaper to catch a renamed or never-added
   * file here than in a bug report.
   */
  it("only points at images that exist", async () => {
    for (const page of pages) {
      const { content } = await getWikiPageBySlug(page.slug);
      const sources = content.match(/\/images\/[^\s"')]+/g) ?? [];

      for (const src of sources) {
        const file = path.join(process.cwd(), "public", src);
        expect(fs.existsSync(file), `${page.slug} references ${src}`).toBe(
          true,
        );
      }
    }
  });

  /**
   * A translation only carries words. Anything that is not a word (the order of
   * components, their props, the links and the item counts inside a pipe-separated
   * prop) has to match the English article, or the translated page renders
   * differently from the one it translates.
   */
  describe("translations", () => {
    const LOCALES: AppLocale[] = ["pl", "de", "es"];
    const cases = pages.flatMap((page) =>
      LOCALES.map((locale) => [page.slug, locale] as const),
    );

    const shape = (content: string) => ({
      tags: content.match(/<\/?[A-Z][A-Za-z]*/g),
      links: content.match(/\]\((?:\/|https?:)[^)\s]*\)/g),
      images: content.match(/\/images\/[^\s"')]+/g),
      // How many entries each pipe-separated prop holds, and how many of them
      // have a `Title::detail` split.
      propShape: [...content.matchAll(/\b([a-z]+)="([^"]*)"/g)].map(
        ([, name, value]) =>
          `${name}:${(value.match(/\|/g) ?? []).length}/${(value.match(/::/g) ?? []).length}`,
      ),
      headings: (content.match(/^#{2,3} /gm) ?? []).length,
    });

    it.each(cases)("%s is translated into %s", async (slug, locale) => {
      expect(
        hasWikiTranslation(slug, locale),
        `${slug} has no ${locale} file`,
      ).toBe(true);

      const english = await getWikiPageBySlug(slug);
      const translated = await getWikiPageBySlug(slug, locale);

      expect(translated.frontmatter.slug).toBe(english.frontmatter.slug);
      expect(translated.frontmatter.section).toBe(english.frontmatter.section);
      expect(translated.frontmatter.order).toBe(english.frontmatter.order);
      expect(translated.frontmatter.description).not.toBe(
        english.frontmatter.description,
      );
      expect(shape(translated.content)).toEqual(shape(english.content));

      const { default: MDXContent } = await evaluate(translated.content, {
        ...jsxRuntime,
        remarkPlugins: [remarkGfm],
      });
      expect(
        renderToStaticMarkup(<MDXContent components={components} />),
      ).not.toBe("");
    });
  });
});
