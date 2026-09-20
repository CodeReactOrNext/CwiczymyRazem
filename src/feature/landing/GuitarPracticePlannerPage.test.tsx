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

import {
  PRACTICE_PLANNER_EXAMPLE,
  PRACTICE_PLANNER_EXAMPLE_ANCHOR,
  PRACTICE_PLANNER_FAQS,
  PRACTICE_PLANNER_META,
  PRACTICE_PLANNER_ROUTES,
} from "./data/practicePlanner";
import { GuitarPracticePlannerPage } from "./GuitarPracticePlannerPage";
import { buildGuitarPracticePlannerProps } from "./lib/practicePlannerProps";

const props = buildGuitarPracticePlannerProps();

describe("guitar practice planner landing", () => {
  it("keeps SERP metadata within limits and the intent split (three FAQs)", () => {
    expect(PRACTICE_PLANNER_META.metaTitle.length).toBeLessThanOrEqual(60);
    expect(PRACTICE_PLANNER_META.metaDescription.length).toBeLessThanOrEqual(
      160,
    );
    // Session length, habit building and the intermediate programme belong to
    // the guides this page links to (duplication review 2026-09-19).
    expect(PRACTICE_PLANNER_FAQS).toHaveLength(3);
  });

  it("quotes real plans and exercises, with the example adding up to 20 minutes", () => {
    expect(props.routines.map((r) => r.title)).toEqual([
      "Mega Beginner: First Steps",
      "Beginner: Daily Exercises",
      "Strumming Foundations",
    ]);
    for (const routine of props.routines) {
      expect(routine.minutes).toBeGreaterThan(0);
      expect(routine.exerciseCount).toBeGreaterThan(0);
    }

    // The screenshots show 3 + 5 + 4 + 8; the blocks must match them.
    expect(props.exampleBlocks.map((b) => b.minutes)).toEqual([3, 5, 4, 8]);
    expect(props.exampleBlocks.reduce((sum, b) => sum + b.minutes, 0)).toBe(
      PRACTICE_PLANNER_EXAMPLE.totalMinutes,
    );
    expect(props.exampleBlocks.map((b) => b.title)).toEqual([
      "Spider — One String",
      "Legato — Hammer-on Pentatonic",
      "Play by Ear — Easy",
      "Phrasing — Two Notes Per Bar",
    ]);
    expect(props.exampleBlocks.map((b) => b.startsAt)).toEqual([0, 3, 8, 12]);
  });

  it("sends every product CTA through sign-up with the feature as `next`", () => {
    expect(PRACTICE_PLANNER_ROUTES.builder.href).toBe(
      "/signup?next=%2Fplans%2Fcreate",
    );
    expect(PRACTICE_PLANNER_ROUTES.routines.href).toBe(
      "/signup?next=%2Ftimer%2Fplans",
    );
    expect(PRACTICE_PLANNER_ROUTES.autoPlan.href).toBe(
      "/signup?next=%2Ftimer%2Fauto",
    );
  });

  it("server-renders the H1, the three paths, the example, the FAQ and the hand-offs", () => {
    const html = renderToString(<GuitarPracticePlannerPage {...props} />);

    expect(html).toContain(PRACTICE_PLANNER_META.title);
    expect(html).toContain(PRACTICE_PLANNER_EXAMPLE.name);
    expect(html).toContain(`id="${PRACTICE_PLANNER_EXAMPLE_ANCHOR}"`);
    for (const block of props.exampleBlocks) {
      expect(html).toContain(block.title);
    }
    for (const routine of props.routines) {
      expect(html).toContain(routine.title);
    }
    for (const faq of PRACTICE_PLANNER_FAQS) {
      expect(html).toContain(faq.title);
    }
    for (const route of Object.values(PRACTICE_PLANNER_ROUTES)) {
      expect(html).toContain(`href="${route.href.replace(/&/g, "&amp;")}"`);
    }
    expect(html).toContain('href="/wiki/exercise-plans-and-auto-plan"');
    expect(html).toContain('href="/daily-guitar-practice-plan"');
    // No dead "use this plan" link: the example was never saved as a template.
    expect(html).not.toMatch(/use this (exact )?plan/i);
    // Self-canonical, no Article/FAQPage schema.
    expect(html).not.toContain('"FAQPage"');
    expect(html).not.toContain('"Article"');
  });
});
