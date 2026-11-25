import posthog from "posthog-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  onboardingHref,
  parseOnboardingSource,
  trackOnboardingCompleted,
  trackOnboardingDailyGoalChosen,
  trackOnboardingFirstMinuteLeft,
  trackOnboardingLevelChosen,
  trackOnboardingPlayChosen,
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

  it("stores the daily goal on the person", () => {
    trackOnboardingDailyGoalChosen({
      minutes: 30,
      level: "some",
      position: 3,
      timeOnStepMs: 2200,
      source: "signup",
    });

    const [event, props] = lastCall();
    expect(event).toBe("onboarding_daily_goal_chosen");
    expect(props).toMatchObject({
      minutes: 30,
      level: "some",
      position: 3,
      time_on_step_ms: 2200,
      $set: { onboarding_daily_goal: 30 },
    });
  });

  it("keeps the old event name for the first-minute choice", () => {
    trackOnboardingPlayChosen({
      choice: "hunt",
      level: "new",
      timeOnStepMs: 1800,
      source: "direct",
    });

    const [event, props] = lastCall();
    expect(event).toBe("onboarding_play_chosen");
    expect(props).toMatchObject({
      choice: "hunt",
      $set: { onboarding_play_choice: "hunt" },
    });
  });

  it("tells a finished first minute from one left early", () => {
    trackOnboardingFirstMinuteLeft({
      kind: "riff",
      level: "experienced",
      finished: false,
      source: "signup",
    });

    expect(lastCall()).toEqual([
      "onboarding_first_minute_left",
      { kind: "riff", level: "experienced", finished: false, source: "signup" },
    ]);
  });

  it("fires one terminal event with the whole answer", () => {
    trackOnboardingCompleted({
      level: "new",
      dailyGoalMinutes: 15,
      playChoice: "browse",
      destination: "/dashboard?tour=1",
      durationMs: 12000,
      source: "google_signup",
    });

    const [event, props] = lastCall();
    expect(event).toBe("onboarding_completed");
    expect(props).toMatchObject({
      level: "new",
      daily_goal_minutes: 15,
      play_choice: "browse",
      destination: "/dashboard?tour=1",
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
