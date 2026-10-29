// @vitest-environment jsdom

import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// next/font/google only works inside the Next compiler; outside it the export
// is a plain object, so hand the page the variable class it expects.
vi.mock("next/font/google", () => ({
  Plus_Jakarta_Sans: () => ({
    variable: "--font-jakarta-landing",
    className: "",
  }),
}));

import { DESKTOP_APP_RELEASES_URL } from "constants/desktopApp";

import { DESKTOP_APP_FAQS, DESKTOP_APP_META } from "./data/desktopApp";
import { DesktopAppPage, PLATFORM_COPY } from "./DesktopAppPage";
import { buildDesktopAppProps, readFeedDetails } from "./lib/desktopAppProps";

/** latest*.yml as electron-builder writes them (trimmed to what is read). */
const FEEDS: Record<string, string> = {
  "latest.yml": `version: 0.2.2
files:
  - url: riff.quest-Setup-0.2.2.exe
    sha512: abc
    size: 102851632
path: riff.quest-Setup-0.2.2.exe
releaseDate: '2026-10-20T21:57:18.863Z'
`,
  "latest-mac.yml": `version: 0.2.2
files:
  - url: riff.quest-0.2.2-arm64-mac.zip
    sha512: abc
    size: 118768994
  - url: riff.quest-0.2.2-arm64.dmg
    sha512: def
    size: 118685789
path: riff.quest-0.2.2-arm64-mac.zip
releaseDate: '2026-10-20T21:58:05.206Z'
`,
  "latest-linux.yml": `version: 0.2.2
files:
  - url: riff.quest-0.2.2.AppImage
    sha512: abc
    size: 127687898
    blockMapSize: 134382
path: riff.quest-0.2.2.AppImage
releaseDate: '2026-10-20T21:56:19.199Z'
`,
};

const fakeFetch = (async (url: string) => {
  const feed = Object.keys(FEEDS).find((name) => url.endsWith(`/${name}`));
  return feed
    ? new Response(FEEDS[feed], { status: 200 })
    : new Response("", { status: 404 });
}) as typeof fetch;

describe("desktop app landing", () => {
  it("keeps SERP metadata within limits", () => {
    expect(DESKTOP_APP_META.metaTitle.length).toBeLessThanOrEqual(60);
    expect(DESKTOP_APP_META.metaDescription.length).toBeLessThanOrEqual(160);
    expect(DESKTOP_APP_FAQS.length).toBeGreaterThanOrEqual(3);
  });

  it("reads the installer, not the zip, off the mac feed", () => {
    expect(readFeedDetails(FEEDS["latest-mac.yml"], ".dmg")).toEqual({
      sizeMb: 119,
      releaseDate: "2026-10-20",
    });
  });

  it("links every platform straight to its installer", async () => {
    const { downloads } = await buildDesktopAppProps(fakeFetch);
    expect(downloads.map((entry) => entry.platform)).toEqual([
      "win32",
      "darwin",
      "linux",
    ]);
    expect(downloads.map((entry) => entry.url.split("/").pop())).toEqual([
      "riff.quest-Setup-0.2.2.exe",
      "riff.quest-0.2.2-arm64.dmg",
      "riff.quest-0.2.2.AppImage",
    ]);
    expect(downloads.every((entry) => entry.version === "0.2.2")).toBe(true);

    const html = renderToString(<DesktopAppPage downloads={downloads} />);
    expect(html.match(/<h1/g)).toHaveLength(1);
    for (const entry of downloads) {
      expect(html).toContain(entry.url);
      expect(html).toContain(PLATFORM_COPY[entry.platform].name);
    }
  });

  it("falls back to the releases page when GitHub does not answer", async () => {
    const failing = (async () => {
      throw new Error("offline");
    }) as typeof fetch;
    const { downloads } = await buildDesktopAppProps(failing);
    expect(downloads).toHaveLength(3);
    expect(
      downloads.every(
        (entry) => entry.url === DESKTOP_APP_RELEASES_URL && !entry.version,
      ),
    ).toBe(true);
    const html = renderToString(<DesktopAppPage downloads={downloads} />);
    expect(html).toContain("Open the releases page");
  });
});
