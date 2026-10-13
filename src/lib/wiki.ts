import fs from "fs";
import matter from "gray-matter";
import path from "path";

import type { AppLocale } from "./i18n/locales";
import { DEFAULT_LOCALE } from "./i18n/locales";

const WIKI_DIR = path.join(process.cwd(), "src/content/wiki");

/**
 * Articles are written in English at the top of the folder. A translation of one
 * lives in a folder named for the language (`wiki/pl/<slug>.md`) and only has to
 * carry the words: the slug, section and order always come from the English file,
 * so a translation can never move an article or break a link. An article with no
 * translation yet is served in English.
 */
const translatedFile = (
  slug: string,
  locale: AppLocale,
): string | undefined => {
  if (locale === DEFAULT_LOCALE) return undefined;
  const file = path.join(WIKI_DIR, locale, `${slug}.md`);
  return fs.existsSync(file) ? file : undefined;
};

export const hasWikiTranslation = (slug: string, locale: AppLocale): boolean =>
  Boolean(translatedFile(slug, locale));

const cssToJs = (cssString: string): string => {
  const styles: Record<string, string> = {};
  cssString.split(";").forEach((rule) => {
    const [property, value] = rule.split(":").map((s) => s.trim());
    if (property && value) {
      const jsProperty = property.replace(/-([a-z])/g, (_, char) =>
        char.toUpperCase(),
      );
      styles[jsProperty] = value;
    }
  });
  return JSON.stringify(styles);
};

const transformStyleAttributes = (content: string): string => {
  return content.replace(/style="([^"]*)"/g, (_match, styleString) => {
    const jsStyles = cssToJs(styleString);
    return `style={${jsStyles}}`;
  });
};

export interface WikiFrontmatter {
  title: string;
  description: string;
  slug: string;
  section: string;
  order?: number;
}

export interface WikiSection {
  section: string;
  pages: WikiFrontmatter[];
}

/** Fixed reading order for the sidebar — sections not listed here sort after these, alphabetically. */
const SECTION_ORDER = [
  "Start Here",
  "Scoring & Progress",
  "Practice",
  "Songs & Library",
  "Skill Development",
  "Community",
  "Competition",
];

/** The English articles — the source of every slug, section and order. */
const getEnglishPages = (): WikiFrontmatter[] => {
  if (!fs.existsSync(WIKI_DIR)) {
    return [];
  }

  const files = fs.readdirSync(WIKI_DIR);

  return (
    files
      .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"))
      .map((file) => {
        const filePath = path.join(WIKI_DIR, file);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const { data } = matter(fileContent);

        return data as WikiFrontmatter;
      })
      // A markdown file without frontmatter isn't an article (a README dropped in
      // the folder, say) — it would otherwise render as a blank sidebar entry.
      .filter((page) => Boolean(page.slug && page.title && page.section))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  );
};

export const getAllWikiPages = (
  locale: AppLocale = DEFAULT_LOCALE,
): WikiFrontmatter[] =>
  getEnglishPages().map((page) => {
    const file = translatedFile(page.slug, locale);
    if (!file) return page;

    const { data } = matter(fs.readFileSync(file, "utf-8"));
    return {
      ...page,
      title: (data.title as string) || page.title,
      description: (data.description as string) || page.description,
    };
  });

export const getWikiSections = (
  locale: AppLocale = DEFAULT_LOCALE,
): WikiSection[] => {
  const pages = getAllWikiPages(locale);
  const sections: WikiSection[] = [];

  pages.forEach((page) => {
    let section = sections.find((s) => s.section === page.section);
    if (!section) {
      section = { section: page.section, pages: [] };
      sections.push(section);
    }
    section.pages.push(page);
  });

  return sections.sort((a, b) => {
    const indexA = SECTION_ORDER.indexOf(a.section);
    const indexB = SECTION_ORDER.indexOf(b.section);
    if (indexA === -1 && indexB === -1)
      return a.section.localeCompare(b.section);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
};

export const getWikiPageBySlug = async (
  slug: string,
  locale: AppLocale = DEFAULT_LOCALE,
) => {
  const english = matter(
    fs.readFileSync(path.join(WIKI_DIR, `${slug}.md`), "utf-8"),
  );
  const file = translatedFile(slug, locale);
  const translated = file ? matter(fs.readFileSync(file, "utf-8")) : undefined;
  const data = {
    ...english.data,
    ...(translated
      ? {
          title: translated.data.title || english.data.title,
          description: translated.data.description || english.data.description,
        }
      : {}),
  };
  const content = (translated ?? english).content;
  const transformedContent = transformStyleAttributes(content);

  return {
    frontmatter: data as WikiFrontmatter,
    content: transformedContent,
  };
};
