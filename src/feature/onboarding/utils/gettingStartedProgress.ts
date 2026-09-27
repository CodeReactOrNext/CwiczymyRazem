import type { GettingStartedQuestState } from "../types";
import { GETTING_STARTED_QUEST_DEFAULTS } from "../types";

export type GettingStartedStepId =
  | "first_session"
  | "first_song"
  | "second_day";

export interface GettingStartedStep {
  id: GettingStartedStepId;
  isDone: boolean;
}

export interface GettingStartedProgressInput {
  quest: GettingStartedQuestState | undefined;
  /** From the user's statistics — any saved practice session counts. */
  sessionCount: number;
  /** Number of guitars already in the user's arsenal inventory. */
  guitarCount: number;
  /** Number of songs already added to the user's library (any status). */
  songCount: number;
  /** Distinct local calendar days with logged practice. */
  practiceDayCount: number;
}

export interface GettingStartedProgress {
  steps: GettingStartedStep[];
  /** True once every step is done. */
  allStepsDone: boolean;
  hasGuitar: boolean;
  /** The first guitar is the reward for the first session, not for the whole list. */
  canClaimReward: boolean;
  rewardClaimed: boolean;
  /** True once every step is done, the reward was claimed and a case was opened. */
  isFullyComplete: boolean;
  /** True while the checklist should still be shown on the dashboard. */
  isVisible: boolean;
}

/**
 * Every step is something the player actually did, read from their data —
 * nothing here is ticked off by opening a modal. The reward sits right after
 * the first session so the Arsenal hook lands on day one; the second day is
 * last because coming back is what the checklist is really for.
 */
export const getGettingStartedProgress = ({
  quest,
  sessionCount,
  guitarCount,
  songCount,
  practiceDayCount,
}: GettingStartedProgressInput): GettingStartedProgress => {
  const state = quest ?? GETTING_STARTED_QUEST_DEFAULTS;

  const steps: GettingStartedStep[] = [
    { id: "first_session", isDone: sessionCount > 0 },
    { id: "first_song", isDone: songCount > 0 },
    { id: "second_day", isDone: practiceDayCount >= 2 },
  ];

  const allStepsDone = steps.every((step) => step.isDone);
  const hasGuitar = guitarCount > 0;
  const rewardClaimed = state.rewardClaimed;
  const canClaimReward = sessionCount > 0 && !rewardClaimed;
  const isFullyComplete = allStepsDone && rewardClaimed && hasGuitar;

  return {
    steps,
    allStepsDone,
    hasGuitar,
    canClaimReward,
    rewardClaimed,
    isFullyComplete,
    isVisible: !state.dismissed && !isFullyComplete,
  };
};
