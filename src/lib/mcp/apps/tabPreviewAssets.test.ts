import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

import {
  ALPHATAB_VERSION,
  ASSET_ORIGIN,
  EXT_APPS_VERSION,
  TAB_PREVIEW_ASSETS,
  TAB_PREVIEW_HTML,
} from "./tabPreviewHtml";

// The connector directory requires the developer to own every resource the
// MCP App fetches, so the tab preview loads nothing from a public CDN: only
// riff.quest's own copies of the npm packages' files.

const root = process.cwd();
const read = (...path: string[]) => readFileSync(join(root, ...path));
const version = (pkg: string) =>
  (
    JSON.parse(read("node_modules", pkg, "package.json").toString()) as {
      version: string;
    }
  ).version;

const NPM_SOURCES = {
  alphaTab: ["@coderline/alphatab", "dist", "alphaTab.min.js"],
  bravura: ["@coderline/alphatab", "dist", "font", "Bravura.woff2"],
  soundFont: ["@coderline/alphatab", "dist", "soundfont", "sonivox.sf2"],
  extApps: [
    "@modelcontextprotocol/ext-apps",
    "dist",
    "src",
    "app-with-deps.js",
  ],
} as const;

describe("tab preview assets", () => {
  it("loads from riff.quest and nowhere else", () => {
    const origins = new Set(
      [...TAB_PREVIEW_HTML.matchAll(/https?:\/\/[^/"'`\s)]+/g)].map(
        ([url]) => url,
      ),
    );
    expect([...origins]).toEqual([ASSET_ORIGIN]);
  });

  it("pins the versions installed from npm", () => {
    expect(version("@coderline/alphatab")).toBe(ALPHATAB_VERSION);
    expect(version("@modelcontextprotocol/ext-apps")).toBe(EXT_APPS_VERSION);
  });

  it.each(Object.entries(NPM_SOURCES))(
    "serves an exact copy of %s from public/",
    (name, source) => {
      const path = TAB_PREVIEW_ASSETS[name as keyof typeof NPM_SOURCES];
      expect(TAB_PREVIEW_HTML).toContain(`${ASSET_ORIGIN}${path}`);
      expect(read("public", path).equals(read("node_modules", ...source))).toBe(
        true,
      );
    },
  );

  it("sends every asset folder with CORS, which the sandbox needs", () => {
    const config = read("next.config.js").toString();
    for (const path of Object.values(TAB_PREVIEW_ASSETS)) {
      const folder = path.split("/")[1];
      expect(config).toContain(`"/${folder}/:path*"`);
    }
    expect(config).toContain('"Access-Control-Allow-Origin", value: "*"');
  });
});
