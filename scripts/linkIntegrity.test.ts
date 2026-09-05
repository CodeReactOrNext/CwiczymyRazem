import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

/**
 * Guard for the two failure modes the 2026-09-05 SEO audit found: a permanent
 * redirect whose destination had been deleted (so the 301 ended on a 404), and
 * article links pointing at posts that no longer exist.
 *
 * Both are invisible in `npm run build` — Next happily serves a 301 to nowhere —
 * so they get checked here instead.
 */

const ROOT = join(__dirname, "..");
const PAGES_DIR = join(ROOT, "src/pages");
const BLOG_DIR = join(ROOT, "src/content/blog");
const WIKI_DIR = join(ROOT, "src/content/wiki");
const GUIDES_DIR = join(ROOT, "src/feature/song-library/song-guides/content");
const LANDING_DIR = join(ROOT, "src/feature/seoLanding/content");

/** Every static route the Pages Router serves, plus the dynamic ones as patterns. */
const collectRoutes = () => {
  const staticRoutes = new Set<string>();
  const dynamicRoutes: RegExp[] = [];

  const walk = (dir: string, prefix: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "api" || entry.name.startsWith("_")) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(path, `${prefix}/${entry.name}`);
        continue;
      }
      if (!/\.tsx?$/.test(entry.name)) continue;
      const base = entry.name.replace(/\.tsx?$/, "");
      const route = base === "index" ? prefix || "/" : `${prefix}/${base}`;
      if (route.includes("[")) {
        // /practice/exercise/[id] -> matches /practice/exercise/<anything>
        const pattern = route
          .replace(/\[\.\.\.[^\]]+\]/g, ".+")
          .replace(/\[[^\]]+\]/g, "[^/]+");
        dynamicRoutes.push(new RegExp(`^${pattern}$`));
      } else {
        staticRoutes.add(route);
      }
    }
  };

  walk(PAGES_DIR, "");
  return { staticRoutes, dynamicRoutes };
};

/** Slugs behind the dynamic routes we actually generate at build time. */
const collectContentSlugs = () => {
  const slugs = new Set<string>();

  for (const file of readdirSync(BLOG_DIR)) {
    if (!/\.mdx?$/.test(file)) continue;
    const raw = readFileSync(join(BLOG_DIR, file), "utf8");
    const match = raw.match(/^slug:\s*"([^"]+)"/m);
    slugs.add(`/blog/${match ? match[1] : file.replace(/\.mdx?$/, "")}`);
  }

  for (const file of readdirSync(GUIDES_DIR)) {
    if (!file.endsWith(".ts") || file.endsWith(".test.ts") || file === "index.ts")
      continue;
    const raw = readFileSync(join(GUIDES_DIR, file), "utf8");
    const match = raw.match(/slug:\s*"([^"]+)"/);
    if (match) slugs.add(`/song-library/${match[1]}`);
  }

  for (const file of readdirSync(WIKI_DIR)) {
    if (!/\.mdx?$/.test(file)) continue;
    slugs.add(`/wiki/${file.replace(/\.mdx?$/, "")}`);
  }

  return slugs;
};

/** Redirect sources -> destinations, read out of next.config.js as text so the
 *  test doesn't have to load the Sentry/PWA-wrapped config. */
const collectRedirects = () => {
  const config = readFileSync(join(ROOT, "next.config.js"), "utf8");
  const map = new Map<string, string>();
  const entry = /source:\s*'([^']+)',\s*\n\s*destination:\s*'([^']+)'/g;
  let match: RegExpExecArray | null;
  while ((match = entry.exec(config))) map.set(match[1], match[2]);

  const generated: { source: string; destination: string }[] = JSON.parse(
    readFileSync(join(ROOT, "scripts/seoRedirects.json"), "utf8")
  );
  for (const item of generated) map.set(item.source, item.destination);

  return map;
};

const { staticRoutes, dynamicRoutes } = collectRoutes();
const contentSlugs = collectContentSlugs();
const redirects = collectRedirects();

const stripQuery = (href: string) => href.split(/[?#]/)[0].replace(/\/$/, "") || "/";

/** A concrete page: a static route or a slug we generate at build time. */
const isKnownPage = (path: string) =>
  staticRoutes.has(path) || contentSlugs.has(path);

const isServedPage = (href: string) => {
  const path = stripQuery(href);
  if (path.includes(":")) return true; // redirect pattern such as /leadboard/:path*
  if (isKnownPage(path)) return true;
  return dynamicRoutes.some((pattern) => pattern.test(path));
};

/** Files served straight from public/ — linked in content but not routes. */
const isPublicAsset = (href: string) =>
  existsSync(join(ROOT, "public", stripQuery(href)));

/** Follows a redirect chain and returns the path it finally lands on. */
const resolve = (href: string): string => {
  let current = stripQuery(href);
  for (let hop = 0; hop < 10; hop++) {
    const next = redirects.get(current);
    if (!next) return current;
    current = stripQuery(next);
  }
  return current;
};

describe("redirect destinations", () => {
  it("every redirect lands on a page that exists", () => {
    const dead = [...redirects.entries()]
      .filter(([, destination]) => destination.startsWith("/"))
      .map(([source, destination]) => ({
        source,
        destination,
        final: resolve(destination),
      }))
      .filter((item) => !isServedPage(item.final))
      .map((item) => `${item.source} -> ${item.destination} (ends at ${item.final})`);

    expect(dead).toEqual([]);
  });

  it("no redirect source is also a real page", () => {
    const shadowed = [...redirects.keys()].filter(
      (source) =>
        !source.includes(":") && !source.includes("*") && isKnownPage(stripQuery(source))
    );

    expect(shadowed).toEqual([]);
  });
});

describe("internal links in content", () => {
  const readContent = (dir: string, filter: (file: string) => boolean) =>
    readdirSync(dir)
      .filter(filter)
      .map((file) => ({ file, raw: readFileSync(join(dir, file), "utf8") }));

  const sources = [
    ...readContent(BLOG_DIR, (file) => /\.mdx?$/.test(file)),
    ...readContent(
      GUIDES_DIR,
      (file) => file.endsWith(".ts") && !file.endsWith(".test.ts")
    ),
    ...readContent(
      LANDING_DIR,
      (file) => file.endsWith(".ts") && !file.endsWith(".test.ts")
    ),
  ];

  it("every internal link resolves to a page", () => {
    const broken: string[] = [];

    for (const { file, raw } of sources) {
      const links = [
        ...raw.matchAll(/\]\((\/[^)\s]*)\)/g),
        ...raw.matchAll(/href="(\/[^"]*)"/g),
      ].map((match) => match[1]);

      for (const link of new Set(links)) {
        // In-page anchors are checked by the heading test, not here.
        if (link.startsWith("/#")) continue;
        if (isPublicAsset(link)) continue;
        if (!isServedPage(resolve(link))) broken.push(`${file}: ${link}`);
      }
    }

    expect(broken).toEqual([]);
  });

  it("no internal link goes through a redirect", () => {
    const hops: string[] = [];

    for (const { file, raw } of sources) {
      const links = [
        ...raw.matchAll(/\]\((\/[^)\s]*)\)/g),
        ...raw.matchAll(/href="(\/[^"]*)"/g),
      ].map((match) => match[1]);

      for (const link of new Set(links)) {
        const path = stripQuery(link);
        if (redirects.has(path)) hops.push(`${file}: ${link} -> ${redirects.get(path)}`);
      }
    }

    expect(hops).toEqual([]);
  });
});
