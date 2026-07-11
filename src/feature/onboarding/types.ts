export type OnboardingPath = "journey" | "exercises" | "report" | "songs";

export interface OnboardingResult {
  chosenPath: OnboardingPath;
}

export const ONBOARDING_TOTAL_STEPS = 2;

/**
 * Persisted progress for the dashboard "Getting Started" checklist shown to new users.
 * `firstExercise` and `firstGuitar` are derived at read time from existing user data
 * (session count / arsenal inventory) instead of being stored here, so they can't drift.
 */
export interface GettingStartedQuestState {
  welcomeSeen: boolean;
  planIntroSeen: boolean;
  customPlanClicked: boolean;
  rewardClaimed: boolean;
  dismissed: boolean;
}

export const GETTING_STARTED_QUEST_DEFAULTS: GettingStartedQuestState = {
  welcomeSeen: false,
  planIntroSeen: false,
  customPlanClicked: false,
  rewardClaimed: false,
  dismissed: false,
};
