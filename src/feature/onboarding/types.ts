/** How long the player has been playing — the first onboarding question. */
export type OnboardingLevel = "new" | "some" | "experienced";

/** What the player came to Riff Quest for — the second onboarding question. */
export type OnboardingGoal = "plans" | "songs" | "roadmap" | "journey" | "log";

/**
 * Asked right after the level: play a 40-second first riff now, or look
 * around first (with or without a guitar to play later).
 */
export type OnboardingPlayChoice = "play" | "browse" | "no_guitar";

export interface OnboardingResult {
  level: OnboardingLevel;
  goal: OnboardingGoal;
  /** Only for the "plans" goal — the plan the player picked. */
  planId?: string;
  playChoice?: OnboardingPlayChoice;
}

