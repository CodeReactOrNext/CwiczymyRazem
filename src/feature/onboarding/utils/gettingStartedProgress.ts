import type { GettingStartedQuestState } from "../types";
import { GETTING_STARTED_QUEST_DEFAULTS } from "../types";

export interface GettingStartedStep {
  id:
    | "welcome"
    | "first_exercise"
    | "first_song"
    | "exercise_plan"
    | "custom_plan";
  isDone: boolean;
}

export interface GettingStartedProgressInput {
  quest: GettingStartedQuestState | undefined;
  /** From the user's statistics — any completed practice session counts as the first exercise. */
  sessionCount: number;
  /** Number of guitars already in the user's arsenal inventory. */
  guitarCount: number;
  /** Number of songs already added to the user's library (any status). */
  songCount: number;
}

export interface GettingStartedProgress {
  steps: GettingStartedStep[];
  /** True once every guided step (excluding the reward step) is done. */
  allStepsDone: boolean;
  hasGuitar: boolean;
  rewardClaimed: boolean;
  /** True once the reward was claimed and the user opened at least one case — checklist can be hidden. */
  isFullyComplete: boolean;
  /** True while the checklist should still be shown on the dashboard. */
  isVisible: boolean;
}

export const getGettingStartedProgress = ({
  quest,
  sessionCount,
  guitarCount,
  songCount,
}: GettingStartedProgressInput): GettingStartedProgress => {
  const state = quest ?? GETTING_STARTED_QUEST_DEFAULTS;

  const steps: GettingStartedStep[] = [
    { id: "welcome", isDone: state.welcomeSeen },
    { id: "first_exercise", isDone: sessionCount > 0 },
    { id: "first_song", isDone: songCount > 0 },
    { id: "exercise_plan", isDone: state.planIntroSeen },
    { id: "custom_plan", isDone: state.customPlanClicked },
  ];

  const allStepsDone = steps.every((step) => step.isDone);
  const hasGuitar = guitarCount > 0;
  const rewardClaimed = state.rewardClaimed;
  const isFullyComplete = rewardClaimed && hasGuitar;

  return {
    steps,
    allStepsDone,
    hasGuitar,
    rewardClaimed,
    isFullyComplete,
    isVisible: !state.dismissed && !isFullyComplete,
  };
};
