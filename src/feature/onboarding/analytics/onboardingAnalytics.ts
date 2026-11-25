import posthog from "posthog-js";

import type {
  FirstMinuteKind,
  OnboardingGoal,
  OnboardingLevel,
  OnboardingPlayChoice,
} from "../types";

/**
 * Every choice the onboarding asks for, as its own event — PostHog funnels
 * are defined per event name, so one event per step keeps each funnel a plain
 * list instead of a filter chain (same reasoning as lib/signupFunnel).
 *
 * The answers are also written onto the person (`onboarding_level`,
 * `onboarding_daily_goal`, `onboarding_play_choice`), so any later metric — a
 * finished session, a second day of practice — can be broken down by them.
 *
 * Since 2026-11-25 the onboarding is level → daily goal → first minute. The
 * goal, plan, songs and "best on a computer" steps and their events are gone.
 */

/** The three questions, in order. */
export type OnboardingStep = "level" | "daily" | "first";

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

/** The daily goal; the same answer is written to Settings → Daily goal. */
export const trackOnboardingDailyGoalChosen = (props: {
  minutes: number;
  level: OnboardingLevel;
  position: number;
  timeOnStepMs: number;
  source: OnboardingSource;
}) => {
  posthog.capture("onboarding_daily_goal_chosen", {
    minutes: props.minutes,
    level: props.level,
    position: props.position,
    time_on_step_ms: props.timeOnStepMs,
    source: props.source,
    $set: { onboarding_daily_goal: props.minutes },
  });
};

/**
 * The first minute: `play` (the riff), `hunt` (the fretboard) or `browse`.
 * The event keeps its old name so the funnel from before 2026-11-25 lines up.
 * Its funnel goes on through onboarding_first_riff_opened /
 * onboarding_first_hunt_opened and onboarding_first_minute_left.
 */
export const trackOnboardingPlayChosen = (props: {
  choice: OnboardingPlayChoice;
  level: OnboardingLevel;
  timeOnStepMs: number;
  source: OnboardingSource;
}) => {
  posthog.capture("onboarding_play_chosen", {
    choice: props.choice,
    level: props.level,
    time_on_step_ms: props.timeOnStepMs,
    source: props.source,
    $set: { onboarding_play_choice: props.choice },
  });
};

/** The first-riff page loaded its exercise; the mic setup opens next. */
export const trackOnboardingFirstRiffOpened = (props: {
  level: OnboardingLevel;
  exerciseId: string;
  source: OnboardingSource;
}) => {
  posthog.capture("onboarding_first_riff_opened", {
    level: props.level,
    exercise_id: props.exerciseId,
    source: props.source,
  });
};

/** The fretboard hunt page loaded its exercise and the session starts. */
export const trackOnboardingFirstHuntOpened = (props: {
  level: OnboardingLevel;
  exerciseId: string;
  source: OnboardingSource;
}) => {
  posthog.capture("onboarding_first_hunt_opened", {
    level: props.level,
    exercise_id: props.exerciseId,
    source: props.source,
  });
};

/** The answer to "can you use a microphone?" before the first riff. */
export const trackOnboardingFirstRiffMicChosen = (props: {
  level: OnboardingLevel;
  withMic: boolean;
  source: OnboardingSource;
}) => {
  posthog.capture("onboarding_first_riff_mic_chosen", {
    level: props.level,
    with_mic: props.withMic,
    source: props.source,
  });
};

/**
 * The walk-through before the first riff ended and the session opens —
 * played through to "Let's play" or skipped (`slides_seen` says how far).
 */
export const trackOnboardingFirstRiffIntroDone = (props: {
  level: OnboardingLevel;
  withMic: boolean;
  skipped: boolean;
  slidesSeen: number;
  source: OnboardingSource;
}) => {
  posthog.capture("onboarding_first_riff_intro_done", {
    level: props.level,
    with_mic: props.withMic,
    skipped: props.skipped,
    slides_seen: props.slidesSeen,
    source: props.source,
  });
};

/**
 * Out of the first minute, on the way to Home and the tour: `finished` when
 * the session ran to its end, `false` when the player left early.
 */
export const trackOnboardingFirstMinuteLeft = (props: {
  kind: FirstMinuteKind;
  level: OnboardingLevel;
  finished: boolean;
  source: OnboardingSource;
}) => {
  posthog.capture("onboarding_first_minute_left", {
    kind: props.kind,
    level: props.level,
    finished: props.finished,
    source: props.source,
  });
};

/** The one terminal event: the player answered everything and was sent on. */
export const trackOnboardingCompleted = (props: {
  level: OnboardingLevel;
  dailyGoalMinutes: number | null;
  playChoice: OnboardingPlayChoice;
  destination: string;
  durationMs: number;
  source: OnboardingSource;
}) => {
  posthog.capture("onboarding_completed", {
    level: props.level,
    daily_goal_minutes: props.dailyGoalMinutes,
    play_choice: props.playChoice,
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

// ─── First-day tour ────────────────────────────────────────────────────────────
// Its own funnel: tour_started → tour_step_viewed (per step) → tour_completed,
// with tour_skipped saying where players gave up on it.

export const trackTourStarted = (props: {
  source: "onboarding" | "menu";
  goal: OnboardingGoal | null;
  noGuitar: boolean;
}) => {
  posthog.capture("tour_started", {
    source: props.source,
    goal: props.goal,
    no_guitar: props.noGuitar,
  });
};

export const trackTourStepViewed = (props: {
  step: string;
  index: number;
  total: number;
}) => {
  posthog.capture("tour_step_viewed", {
    step: props.step,
    index: props.index,
    total: props.total,
  });
};

export const trackTourSkipped = (props: {
  step: string;
  index: number;
  total: number;
  durationMs: number;
}) => {
  posthog.capture("tour_skipped", {
    step: props.step,
    index: props.index,
    total: props.total,
    duration_ms: props.durationMs,
  });
};

export const trackTourCompleted = (props: {
  durationMs: number;
  /** Where the goodbye card sent the player; `null` = they just closed it. */
  destination: string | null;
}) => {
  posthog.capture("tour_completed", {
    duration_ms: props.durationMs,
    destination: props.destination,
    $set_once: { tour_completed_at: new Date().toISOString() },
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
