/** How long the player has been playing — the first onboarding question. */
export type OnboardingLevel = "new" | "some" | "experienced";

/** What the player came to Riff Quest for — the second onboarding question. */
export type OnboardingGoal = "plans" | "songs" | "roadmap" | "journey" | "log";

export interface OnboardingResult {
  level: OnboardingLevel;
  goal: OnboardingGoal;
  /** Only for the "plans" goal — the plan the player picked. */
  planId?: string;
}

