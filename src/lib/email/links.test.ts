import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SEND_SOURCE = readFileSync(
  path.join(ROOT, "src/lib/email/send.ts"),
  "utf8",
);

function linkedPaths(): string[] {
  const matches = SEND_SOURCE.matchAll(/\$\{baseUrl\}(\/[A-Za-z0-9/_-]*)/g);
  return [...new Set([...matches].map((m) => m[1]))];
}

function hasRoute(route: string): boolean {
  const candidates = [
    `src/pages${route}.tsx`,
    `src/pages${route}.ts`,
    `src/pages${route}/index.tsx`,
    `src/app${route}/page.tsx`,
  ];
  return candidates.some((c) => existsSync(path.join(ROOT, c)));
}

describe("email links", () => {
  it("points every CTA at a route that exists", () => {
    const routes = linkedPaths();
    expect(routes.length).toBeGreaterThan(0);
    expect(routes.filter((r) => !hasRoute(r))).toEqual([]);
  });

  it("uses the leaderboard route, not the leadboard feature-folder name", () => {
    expect(SEND_SOURCE).not.toContain("/leadboard");
  });
});
