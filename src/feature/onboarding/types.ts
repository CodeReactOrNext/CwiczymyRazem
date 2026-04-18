export type OnboardingPath = "journey" | "exercises" | "report" | "songs";

export interface OnboardingResult {
  chosenPath: OnboardingPath;
}

export const ONBOARDING_TOTAL_STEPS = 2;
