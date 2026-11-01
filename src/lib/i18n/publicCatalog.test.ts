import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { CORE_NAMESPACES, TRANSLATION_NAMESPACES } from "./namespaces";

/**
 * Guards the core / app split of the English catalog (see `CORE_NAMESPACES`).
 *
 * Walks the import graph of every page. Code that renders on a page which never
 * statically imports `lib/i18n/fullCatalog` — public pages, `_app`, and anything
 * they pull in — may only use core namespaces; otherwise it would print raw keys
 * (and, during hydration, mismatch the server HTML). Each `import()` /
 * `dynamic()` target is its own chunk, so it is checked as its own context: it
 * passes if it imports the full catalog itself or is only ever loaded from
 * contexts that already have it.
 *
 * The scan is textual: `useTranslation("ns")`, `useTranslation(["a", "b"])`,
 * an empty `useTranslation()` or `i18n.t(` (both mean `common`), and any string
 * starting with `ns:`. It over-approximates, which only ever makes it stricter.
 */

const ROOT = process.cwd();
const FULL_CATALOG = path.join(ROOT, "src", "lib", "i18n", "fullCatalog.ts");
const PAGES_DIR = path.join(ROOT, "src", "pages");
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];
const KNOWN = new Set<string>(TRANSLATION_NAMESPACES);

/**
 * Files whose app-only keys are safe without the full catalog, with the reason.
 * Keep this short: each entry is a promise the scan cannot check.
 */
const EXEMPT: Record<string, string> = {
  // Reached from _app through achievement data, but its strings are only built
  // inside Arsenal UI, and every one of them passes an English fallback.
  "src/feature/arsenal/data/boardDuplicates.ts": "translateOr fallbacks",
  // In the song-guide riff player, but its translated part only mounts for
  // multi-track scores (guide riffs are single-track) and has an English default.
  "src/feature/exercisePlan/views/PracticeSession/components/AlphaTabScoreViewer/TrackSelector.tsx":
    "multi-track only, English default",
};
const CORE = new Set<string>(CORE_NAMESPACES);

const tsconfig = JSON.parse(
  fs.readFileSync(path.join(ROOT, "tsconfig.json"), "utf8"),
) as { compilerOptions: { paths: Record<string, string[]> } };
const ALIASES = Object.fromEntries(
  Object.entries(tsconfig.compilerOptions.paths).map(([alias, [target]]) => [
    alias.replace("/*", ""),
    target.replace("/*", ""),
  ]),
);

const relative = (file: string) => path.relative(ROOT, file).replace(/\\/g, "/");

const tryFile = (base: string): string | null => {
  for (const ext of ["", ...EXTENSIONS]) {
    const candidate = base + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return EXTENSIONS.includes(path.extname(candidate)) ? candidate : null;
    }
  }
  for (const ext of EXTENSIONS) {
    const candidate = path.join(base, `index${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
};

const resolveImport = (specifier: string, from: string): string | null => {
  if (specifier.startsWith(".")) {
    return tryFile(path.resolve(path.dirname(from), specifier));
  }
  const [head] = specifier.split("/");
  const target = ALIASES[head];
  if (!target) return null;
  return tryFile(path.resolve(ROOT, target, specifier.slice(head.length + 1)));
};

interface ParsedModule {
  staticImports: string[];
  dynamicImports: string[];
  namespaces: Set<string>;
}

const parsed = new Map<string, ParsedModule>();

const parseModule = (file: string): ParsedModule => {
  const cached = parsed.get(file);
  if (cached) return cached;

  const source = fs.readFileSync(file, "utf8");
  const staticSpecs: string[] = [];
  for (const match of source.matchAll(
    /(?:^|[\s;])(import|export)\s+(type\s+)?(?:[^"';]*?\s+from\s+)?["']([^"']+)["']/gm,
  )) {
    if (!match[2]) staticSpecs.push(match[3]);
  }
  const dynamicSpecs = [
    ...source.matchAll(/(?:import|require)\(\s*["']([^"']+)["']\s*\)/g),
  ].map((match) => match[1]);

  const namespaces = new Set<string>();
  for (const match of source.matchAll(/useTranslation\(([^)]*)\)/g)) {
    const literals = [...match[1].matchAll(/["']([a-z_0-9]+)["']/g)].map(
      (literal) => literal[1],
    );
    if (literals.length === 0 && match[1].trim() === "") {
      namespaces.add("common");
    }
    literals.filter((name) => KNOWN.has(name)).forEach((name) => namespaces.add(name));
  }
  for (const match of source.matchAll(/["'`]([a-z_0-9]+):[A-Za-z_{$]/g)) {
    if (KNOWN.has(match[1])) namespaces.add(match[1]);
  }
  if (/\bi18n\.t\(/.test(source)) namespaces.add("common");

  const resolveAll = (specs: string[]) =>
    specs
      .map((spec) => resolveImport(spec, file))
      .filter((resolved): resolved is string => Boolean(resolved));

  const result = {
    staticImports: resolveAll(staticSpecs),
    dynamicImports: resolveAll(dynamicSpecs),
    namespaces,
  };
  parsed.set(file, result);
  return result;
};

interface Context {
  hasFullCatalog: boolean;
  /** namespace -> first file that uses it */
  namespaces: Map<string, string>;
  dynamicRoots: Set<string>;
}

const contexts = new Map<string, Context>();

/** The static closure of `root`: everything that is in the same chunk graph. */
const contextOf = (root: string): Context => {
  const cached = contexts.get(root);
  if (cached) return cached;

  const context: Context = {
    hasFullCatalog: false,
    namespaces: new Map(),
    dynamicRoots: new Set(),
  };
  const seen = new Set<string>();
  const stack = [root];
  while (stack.length > 0) {
    const file = stack.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    if (file === FULL_CATALOG) {
      context.hasFullCatalog = true;
      continue;
    }
    const parsedModule = parseModule(file);
    if (!EXEMPT[relative(file)]) parsedModule.namespaces.forEach((name) => {
      if (!context.namespaces.has(name)) context.namespaces.set(name, file);
    });
    stack.push(...parsedModule.staticImports);
    parsedModule.dynamicImports.forEach((target) => context.dynamicRoots.add(target));
  }
  contexts.set(root, context);
  return context;
};

/** Violations for `root` and every chunk it can lazily load. */
const checkEntry = (entry: string): string[] => {
  const problems: string[] = [];
  const visited = new Set<string>();
  const queue: { root: string; inheritedFull: boolean; via: string }[] = [
    { root: entry, inheritedFull: false, via: relative(entry) },
  ];

  while (queue.length > 0) {
    const { root, inheritedFull, via } = queue.shift() as (typeof queue)[number];
    const key = `${root}|${inheritedFull}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const context = contextOf(root);
    const full = inheritedFull || context.hasFullCatalog;
    if (!full) {
      for (const [name, file] of context.namespaces) {
        if (!CORE.has(name)) {
          problems.push(`${via}: "${name}" used in ${relative(file)}`);
        }
      }
    }
    for (const target of context.dynamicRoots) {
      queue.push({
        root: target,
        inheritedFull: full,
        via: `${via} -> import(${relative(target)})`,
      });
    }
  }
  return problems;
};

const listPages = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "api" ? [] : listPages(full);
    return /\.tsx?$/.test(entry.name) && entry.name !== "_document.tsx"
      ? [full]
      : [];
  });

describe("English catalog split", () => {
  it("never puts app-only namespaces on a page without the full catalog", () => {
    const problems = listPages(PAGES_DIR).flatMap(checkEntry);
    expect(
      [...new Set(problems)].sort(),
      "Either add the namespace to CORE_NAMESPACES (it then ships on every " +
        'page) or `import "lib/i18n/fullCatalog";` in the page or lazy ' +
        "component that renders it.",
    ).toEqual([]);
  });

  it("keeps the full catalog out of _app", () => {
    expect(contextOf(path.join(PAGES_DIR, "_app.tsx")).hasFullCatalog).toBe(
      false,
    );
  });

  it("keeps the full catalog out of the public landing pages", () => {
    const publicPages = [
      "index.tsx",
      "song-library/[slug].tsx",
      "blog/[slug].tsx",
      "beginner-guitar-exercises.tsx",
      "how-it-works.tsx",
    ];
    for (const page of publicPages) {
      expect(contextOf(path.join(PAGES_DIR, page)).hasFullCatalog, page).toBe(
        false,
      );
    }
  });
});
