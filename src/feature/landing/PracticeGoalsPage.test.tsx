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
  autoStepBpm,
  goalPath,
  isGoalEligibleExercise,
  MAX_GOAL_STAGES,
} from "feature/exerciseGoals/utils/goalRules";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { safeNextPath } from "utils/auth/safeNextPath";

import {
  PRACTICE_GOALS_FAQS,
  PRACTICE_GOALS_META,
  PRACTICE_GOALS_ROUTES,
  PRACTICE_GOALS_SHOWCASE,
} from "./data/practiceGoals";
import { buildPracticeGoalsProps } from "./lib/practiceGoalsProps";
import { PracticeGoalsPage } from "./PracticeGoalsPage";

const props = buildPracticeGoalsProps();
const html = renderToString(<PracticeGoalsPage {...props} />);

describe("practice goals landing", () => {
  it("keeps SERP metadata within limits", () => {
    expect(PRACTICE_GOALS_META.metaTitle.length).toBeLessThanOrEqual(60);
    expect(PRACTICE_GOALS_META.metaDescription.length).toBeLessThanOrEqual(160);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(PRACTICE_GOALS_FAQS.length).toBeGreaterThanOrEqual(3);
  });

  it("sends both CTAs through sign-up to their pages", () => {
    for (const [target, path] of [
      ["goals", "/goals"],
      ["rotation", "/rotation"],
    ] as const) {
      const href = PRACTICE_GOALS_ROUTES[target];
      const next = new URLSearchParams(href.split("?")[1]).get("next");
      expect(safeNextPath(next)).toBe(path);
      expect(html).toContain(href.replace(/&/g, "&amp;"));
    }
  });

  it("climbs a goal the app would accept", () => {
    const { startBpm, targetBpm } = PRACTICE_GOALS_SHOWCASE;
    const path = goalPath(
      startBpm,
      targetBpm,
      autoStepBpm(startBpm, targetBpm),
    );
    expect(path[0]).toBe(startBpm);
    expect(path[path.length - 1]).toBe(targetBpm);
    expect(path.length).toBeLessThanOrEqual(MAX_GOAL_STAGES);
    expect(props.exerciseTitle).toBe(
      exercisesAgregat.find(
        (exercise) => exercise.id === PRACTICE_GOALS_SHOWCASE.exerciseId,
      )!.title,
    );
    expect(props.eligibleCount).toBe(
      exercisesAgregat.filter(isGoalEligibleExercise).length,
    );
  });
});
