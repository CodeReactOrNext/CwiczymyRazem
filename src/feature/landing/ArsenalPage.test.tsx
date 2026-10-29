// @vitest-environment jsdom

import fs from "fs";
import path from "path";
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

import { CASE_DEFINITIONS } from "feature/arsenal/data/caseDefinitions";
import { EFFECT_DEFINITIONS } from "feature/arsenal/data/effectDefinitions";
import { GUITAR_DEFINITIONS } from "feature/arsenal/data/guitarDefinitions";
import { DAILY_QUEST_FAME_REWARD } from "feature/user/store/userSlice.questActions";
import { safeNextPath } from "utils/auth/safeNextPath";

import { ArsenalPage } from "./ArsenalPage";
import {
  ARSENAL_APP_PATH,
  ARSENAL_CTA_HREF,
  ARSENAL_DAILY_QUEST_FAME,
  ARSENAL_FAQS,
  ARSENAL_META,
  ARSENAL_STANDARD_CASE_FAME,
} from "./data/arsenal";
import { buildArsenalProps } from "./lib/arsenalProps";

const props = buildArsenalProps();
const html = renderToString(<ArsenalPage {...props} />);
const publicFile = (src: string) =>
  path.join(process.cwd(), "public", src.replace(/^\//, ""));

describe("arsenal landing", () => {
  it("keeps SERP metadata within limits", () => {
    expect(ARSENAL_META.metaTitle.length).toBeLessThanOrEqual(60);
    expect(ARSENAL_META.metaDescription.length).toBeLessThanOrEqual(160);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(ARSENAL_FAQS.length).toBeGreaterThanOrEqual(3);
  });

  it("sends the CTA through sign-up to the Arsenal", () => {
    const next = new URLSearchParams(ARSENAL_CTA_HREF.split("?")[1]).get(
      "next",
    );
    expect(safeNextPath(next)).toBe(ARSENAL_APP_PATH);
    expect(html).toContain(ARSENAL_CTA_HREF.replace(/&/g, "&amp;"));
  });

  it("quotes the game's own numbers", () => {
    expect(ARSENAL_DAILY_QUEST_FAME).toBe(DAILY_QUEST_FAME_REWARD);
    expect(ARSENAL_STANDARD_CASE_FAME).toBe(CASE_DEFINITIONS.standard.fameCost);
    expect(props.counts.guitars).toBe(GUITAR_DEFINITIONS.length);
    expect(props.counts.pedals).toBe(EFFECT_DEFINITIONS.length);
    for (const entry of props.cases) {
      expect(html).toContain(entry.name);
    }
  });

  it("only points at art that exists", () => {
    const images = [
      ...props.cases.map((entry) => entry.image),
      ...props.reveals.flatMap((reveal) => [
        reveal.caseImage,
        reveal.gear.image,
      ]),
      ...props.gallery.map((gear) => gear.image),
      ...props.chain.map((gear) => gear.image),
    ];
    for (const src of images) {
      expect(fs.existsSync(publicFile(src)), src).toBe(true);
    }
  });
});
