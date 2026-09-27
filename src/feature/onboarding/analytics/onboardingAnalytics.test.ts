import posthog from "posthog-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  onboardingHref,
  parseOnboardingSource,
  trackOnboardingCompleted,
  trackOnboardingGoalChosen,
  trackOnboardingLevelChosen,
  trackOnboardingPlanChosen,
  trackOnboardingSkipped,
  trackOnboardingViewed,
} from "./onboardingAnalytics";

vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));

const capture = vi.mocked(posthog.capture);
const lastCall = () => capture.mock.calls.at(-1)!;

describe("onboardingAnalytics", () => {
  beforeEach(() => capture.mockClear());

  it("reads the entry source from ?from=, falling back to direct", () => {
    expect(parseOnboardingSource("signup")).toBe("signup");
    expect(parseOnboardingSource(["google_signup"])).toBe("google_signup");
    expect(parseOnboardingSource("newsletter")).toBe("direct");
    expect(parseOnboardingSource(undefined)).toBe("direct");
  });

  it("builds the onboarding link a sign-up flow redirects to", () => {
    expect(onboardingHref("signup")).toBe("/onboarding?from=signup");
  });

  it("tags the view with its source", () => {
    trackOnboardingViewed("signup");
    expect(lastCall()).toEqual(["onboarding_viewed", { source: "signup" }]);
  });

  it("stores the chosen level on the person", () => {
    trackOnboardingLevelChosen({
      level: "some",
      position: 2,
      timeOnStepMs: 1500,
      source: "direct",
    });

    const [event, props] = lastCall();
    expect(event).toBe("onboarding_level_chosen");
    expect(props).toMatchObject({
      level: "some",
      position: 2,
      time_on_step_ms: 1500,
      $set: { onboarding_level: "some" },
    });
  });

  it("records which goals were on offer next to the one picked", () => {
    trackOnboardingGoalChosen({
      goal: "songs",
      level: "new",
      position: 3,
      optionsShown: ["journey", "plans", "songs"],
      timeOnStepMs: 4000,
      source: "signup",
    });

    const [event, props] = lastCall();
    expect(event).toBe("onboarding_goal_chosen");
    expect(props).toMatchObject({
      goal: "songs",
      level: "new",
      options_count: 3,
      options_shown: ["journey", "plans", "songs"],
      $set: { onboarding_goal: "songs" },
    });
  });

  it("describes a listed plan pick", () => {
    trackOnboardingPlanChosen({
      plan: {
        id: "strumming_foundations",
        title: "Strumming Foundations",
        difficulty: "beginner",
        minutes: 8,
        position: 3,
      },
      level: "new",
      timeOnStepMs: 2000,
      source: "signup",
    });

    expect(lastCall()[1]).toMatchObject({
      choice: "listed_plan",
      plan_id: "strumming_foundations",
      plan_difficulty: "beginner",
      plan_minutes: 8,
      position: 3,
      $set: { onboarding_plan_id: "strumming_foundations" },
    });
  });

  it("tells a jump to the full library apart from a listed plan", () => {
    trackOnboardingPlanChosen({
      plan: null,
      level: "experienced",
      timeOnStepMs: 900,
      source: "direct",
    });

    expect(lastCall()[1]).toMatchObject({
      choice: "all_plans",
      plan_id: null,
      $set: { onboarding_plan_id: "all_plans" },
    });
  });

  it("fires one terminal event with the whole answer", () => {
    trackOnboardingCompleted({
      level: "new",
      goal: "journey",
      planId: null,
      destination: "/journey",
      durationMs: 12000,
      source: "google_signup",
    });

    const [event, props] = lastCall();
    expect(event).toBe("onboarding_completed");
    expect(props).toMatchObject({
      level: "new",
      goal: "journey",
      plan_id: null,
      destination: "/journey",
      duration_ms: 12000,
      source: "google_signup",
    });
    expect(props).toHaveProperty("$set_once.onboarding_completed_at");
  });

  it("records where a skip happened", () => {
    trackOnboardingSkipped({
      step: "level",
      level: null,
      durationMs: 3000,
      source: "signup",
    });

    expect(lastCall()).toEqual([
      "onboarding_skipped",
      { step: "level", level: null, duration_ms: 3000, source: "signup" },
    ]);
  });
});
