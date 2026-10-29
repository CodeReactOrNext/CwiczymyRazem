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

import { achievementsData } from "feature/achievements/data/achievementsData";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { ReportFormikInterface } from "feature/user/view/ReportView/ReportView.types";
import { safeNextPath } from "utils/auth/safeNextPath";
import { makeRatingData } from "utils/gameLogic/makeRatingData";

import {
  PROGRESS_APP_PATH,
  PROGRESS_CTA_HREF,
  PROGRESS_FAQS,
  PROGRESS_META,
  PROGRESS_POINTS_PER_HOUR,
  sessionPoints,
} from "./data/progress";
import { buildProgressProps } from "./lib/progressProps";
import { ProgressPage } from "./ProgressPage";

const props = buildProgressProps();
const html = renderToString(<ProgressPage {...props} />);

describe("progress landing", () => {
  it("keeps SERP metadata within limits", () => {
    expect(PROGRESS_META.metaTitle.length).toBeLessThanOrEqual(60);
    expect(PROGRESS_META.metaDescription.length).toBeLessThanOrEqual(160);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(PROGRESS_FAQS.length).toBeGreaterThanOrEqual(3);
  });

  it("sends the CTA through sign-up to the log form", () => {
    const next = new URLSearchParams(PROGRESS_CTA_HREF.split("?")[1]).get(
      "next",
    );
    expect(safeNextPath(next)).toBe(PROGRESS_APP_PATH);
  });

  it("works points out exactly like the report does", () => {
    for (const minutes of [5, 30, 45, 60, 120]) {
      for (const habits of [0, 3, 5]) {
        for (const streak of [1, 2, 3, 4, 5, 9]) {
          const report = {
            habbits: Array.from({ length: habits }, (_, i) => `h${i}`),
          } as unknown as ReportFormikInterface;
          const expected = makeRatingData(
            report,
            minutes * 60_000,
            streak,
          ).totalPoints;
          expect(sessionPoints(minutes, habits, streak).total).toBe(expected);
        }
      }
    }
    expect(PROGRESS_POINTS_PER_HOUR).toBe(22);
  });

  it("quotes the real catalogue sizes, here and in the description", () => {
    expect(props.skills).toBe(guitarSkills.length);
    expect(props.achievementsTotal).toBe(achievementsData.length);
    expect(PROGRESS_META.metaDescription).toContain(
      `${guitarSkills.length} skills`,
    );
    expect(PROGRESS_META.metaDescription).toContain(
      `${achievementsData.length} achievements`,
    );
    expect(props.achievementExample.title.length).toBeGreaterThan(0);
  });
});
