/** How long the player has been playing — the first onboarding question. */
export type OnboardingLevel = "new" | "some" | "experienced";

/**
 * What a player came for. The onboarding no longer asks it; the tour still
 * reads one from older links (`?goal=`) and ends on it.
 */
export type OnboardingGoal = "plans" | "songs" | "roadmap" | "journey" | "log";

/**
 * The first minute, the last onboarding question: play a 40-second riff,
 * find notes on the neck by clicking (no guitar needed), or look around.
 */
export type OnboardingPlayChoice = "play" | "hunt" | "browse";

/** Which first minute the player went into. */
export type FirstMinuteKind = "riff" | "hunt";

export interface OnboardingResult {
  level: OnboardingLevel;
  /** The daily goal picked in the onboarding; `null` when that step was skipped. */
  dailyGoalMinutes: number | null;
  playChoice: OnboardingPlayChoice | null;
}
