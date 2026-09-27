import posthog from "posthog-js";

import type { OnboardingGoal, OnboardingLevel } from "../types";

/**
 * Every choice the onboarding asks for, as its own event — PostHog funnels
 * are defined per event name, so one event per step keeps each funnel a plain
 * list instead of a filter chain (same reasoning as lib/signupFunnel).
 *
 * The answers are also written onto the person (`onboarding_level`,
 * `onboarding_goal`, `onboarding_plan_id`), so any later metric — a finished
 * session, a song added, a second day of practice — can be broken down by
 * what the player said they came for.
 */

export type OnboardingStep = "level" | "goal" | "plan";

/**
 * Wall-clock timing for time-on-step and total duration. Kept out of the
 * component so the view never reads the clock itself.
 */
export const createOnboardingClock = () => {
  let startedAt = Date.now();
  let stepStartedAt = startedAt;

  return {
    restart: () => {
      startedAt = Date.now();
      stepStartedAt = startedAt;
    },
    /** Time on the current step; restarts the clock for the next one. */
    takeStep: () => {
      const now = Date.now();
      const elapsed = now - stepStartedAt;
      stepStartedAt = now;
      return elapsed;
    },
    total: () => Date.now() - startedAt,
  };
};

export type OnboardingClock = ReturnType<typeof createOnboardingClock>;

/** How the player got to the onboarding: straight from a sign-up or by URL. */
export type OnboardingSource = "signup" | "google_signup" | "direct";

export const ONBOARDING_SOURCES: OnboardingSource[] = [
  "signup",
  "google_signup",
  "direct",
];

export const parseOnboardingSource = (value: unknown): OnboardingSource => {
  const raw = Array.isArray(value) ? value[0] : value;
  return ONBOARDING_SOURCES.includes(raw as OnboardingSource)
    ? (raw as OnboardingSource)
    : "direct";
};

/** The `?from=` a sign-up flow appends so the onboarding knows where it came from. */
export const onboardingHref = (source: Exclude<OnboardingSource, "direct">) =>
  `/onboarding?from=${source}`;

export const trackOnboardingViewed = (source: OnboardingSource) => {
  posthog.capture("onboarding_viewed", { source });
};

export const trackOnboardingLevelChosen = (props: {
  level: OnboardingLevel;
  position: number;
  timeOnStepMs: number;
  source: OnboardingSource;
}) => {
  posthog.capture("onboarding_level_chosen", {
    level: props.level,
    position: props.position,
    time_on_step_ms: props.timeOnStepMs,
    source: props.source,
    $set: { onboarding_level: props.level },
  });
};

export const trackOnboardingGoalChosen = (props: {
  goal: OnboardingGoal;
  level: OnboardingLevel;
  position: number;
  optionsShown: OnboardingGoal[];
  timeOnStepMs: number;
  source: OnboardingSource;
}) => {
  posthog.capture("onboarding_goal_chosen", {
    goal: props.goal,
    level: props.level,
    position: props.position,
    options_shown: props.optionsShown,
    options_count: props.optionsShown.length,
    time_on_step_ms: props.timeOnStepMs,
    source: props.source,
    $set: { onboarding_goal: props.goal },
  });
};

export const trackOnboardingPlanChosen = (props: {
  /** `null` when the player went to the full library instead of a listed plan. */
  plan: {
    id: string;
    title: string;
    difficulty: string;
    minutes: number;
    position: number;
  } | null;
  level: OnboardingLevel;
  timeOnStepMs: number;
  source: OnboardingSource;
}) => {
  posthog.capture("onboarding_plan_chosen", {
    choice: props.plan ? "listed_plan" : "all_plans",
    plan_id: props.plan?.id ?? null,
    plan_title: props.plan?.title ?? null,
    plan_difficulty: props.plan?.difficulty ?? null,
    plan_minutes: props.plan?.minutes ?? null,
    position: props.plan?.position ?? null,
    level: props.level,
    time_on_step_ms: props.timeOnStepMs,
    source: props.source,
    $set: { onboarding_plan_id: props.plan?.id ?? "all_plans" },
  });
};

/** The one terminal event: the player answered everything and was sent on. */
export const trackOnboardingCompleted = (props: {
  level: OnboardingLevel;
  goal: OnboardingGoal;
  planId: string | null;
  destination: string;
  durationMs: number;
  source: OnboardingSource;
}) => {
  posthog.capture("onboarding_completed", {
    level: props.level,
    goal: props.goal,
    plan_id: props.planId,
    destination: props.destination,
    duration_ms: props.durationMs,
    source: props.source,
    $set_once: { onboarding_completed_at: new Date().toISOString() },
  });
};

export const trackOnboardingBack = (props: {
  fromStep: OnboardingStep;
  level: OnboardingLevel;
  timeOnStepMs: number;
}) => {
  posthog.capture("onboarding_back", {
    from_step: props.fromStep,
    level: props.level,
    time_on_step_ms: props.timeOnStepMs,
  });
};

export const trackOnboardingSkipped = (props: {
  step: OnboardingStep;
  /** Only known once the first question was answered. */
  level: OnboardingLevel | null;
  durationMs: number;
  source: OnboardingSource;
}) => {
  posthog.capture("onboarding_skipped", {
    step: props.step,
    level: props.level,
    duration_ms: props.durationMs,
    source: props.source,
  });
};
