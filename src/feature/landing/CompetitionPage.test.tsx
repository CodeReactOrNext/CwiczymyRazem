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

import { SEASON_FAME_REWARDS } from "constants/seasonRewards";
import { DAILY_EXERCISE_POOL } from "feature/dailyExercise/utils/dailyExercise";
import { safeNextPath } from "utils/auth/safeNextPath";

import { CompetitionPage } from "./CompetitionPage";
import {
  COMPETITION_FAQS,
  COMPETITION_META,
  COMPETITION_ROUTES,
} from "./data/competition";
import { buildCompetitionProps } from "./lib/competitionProps";

const props = buildCompetitionProps();
const html = renderToString(<CompetitionPage {...props} />);

describe("competition landing", () => {
  it("keeps SERP metadata within limits", () => {
    expect(COMPETITION_META.metaTitle.length).toBeLessThanOrEqual(60);
    expect(COMPETITION_META.metaDescription.length).toBeLessThanOrEqual(160);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(COMPETITION_FAQS.length).toBeGreaterThanOrEqual(3);
  });

  it("sends both CTAs through sign-up to their pages", () => {
    for (const [target, path] of [
      ["seasons", "/seasons"],
      ["challenges", "/challenges"],
    ] as const) {
      const href = COMPETITION_ROUTES[target];
      const next = new URLSearchParams(href.split("?")[1]).get("next");
      expect(safeNextPath(next)).toBe(path);
      expect(html).toContain(href.replace(/&/g, "&amp;"));
    }
  });

  it("lists every paid season place and the real daily pool", () => {
    for (const fame of SEASON_FAME_REWARDS) {
      expect(html).toContain(String(fame));
    }
    expect(props.daily.poolSize).toBe(DAILY_EXERCISE_POOL.length);
    expect(props.daily.poolSize).toBeGreaterThan(0);
  });
});
