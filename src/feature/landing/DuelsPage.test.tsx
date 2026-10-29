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

import { nextRating } from "feature/duels/utils/duelRules";
import { safeNextPath } from "utils/auth/safeNextPath";

import {
  DUELS_APP_PATH,
  DUELS_CTA_HREF,
  DUELS_FAQS,
  DUELS_IDEAS,
  DUELS_META,
  DUELS_REAL_DUEL,
} from "./data/duels";
import { DuelsPage } from "./DuelsPage";
import { buildDuelsProps } from "./lib/duelsProps";

const props = buildDuelsProps();
const html = renderToString(<DuelsPage {...props} />);

describe("duels landing", () => {
  it("keeps SERP metadata within limits", () => {
    expect(DUELS_META.metaTitle.length).toBeLessThanOrEqual(60);
    expect(DUELS_META.metaDescription.length).toBeLessThanOrEqual(160);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(DUELS_FAQS.length).toBeGreaterThanOrEqual(3);
  });

  it("sends the CTA through sign-up to /duels", () => {
    const next = new URLSearchParams(DUELS_CTA_HREF.split("?")[1]).get("next");
    expect(safeNextPath(next)).toBe(DUELS_APP_PATH);
    expect(html).toContain(DUELS_CTA_HREF.replace(/&/g, "&amp;"));
  });

  it("says what a duel is, not the rulebook", () => {
    for (const idea of DUELS_IDEAS) expect(html).toContain(idea.label);
    expect(html).not.toContain("exercises in the pool");
  });

  it("shows a real duel the rating maths agrees with", () => {
    const { you, opponent } = DUELS_REAL_DUEL;
    expect(you.best).toBeGreaterThan(opponent.best);
    // Both had played fewer than ten rated duels then: K 40.
    expect(nextRating(you.ratingBefore, 0, opponent.ratingBefore, 1)).toBe(
      you.ratingAfter,
    );
    expect(nextRating(opponent.ratingBefore, 0, you.ratingBefore, 0)).toBe(
      opponent.ratingAfter,
    );
    expect(props.realDuelExercise.length).toBeGreaterThan(0);
  });
});
