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

/**
 * Persisted progress for the dashboard "Getting Started" checklist shown to new users.
 * The steps themselves (first session, first song, a second day of practice) are
 * derived at read time from existing user data instead of being stored here, so
 * they can't drift or be ticked off by a click.
 */
export interface GettingStartedQuestState {
  rewardClaimed: boolean;
  dismissed: boolean;
}

export const GETTING_STARTED_QUEST_DEFAULTS: GettingStartedQuestState = {
  rewardClaimed: false,
  dismissed: false,
};
