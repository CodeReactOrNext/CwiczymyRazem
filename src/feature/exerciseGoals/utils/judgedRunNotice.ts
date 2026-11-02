import type { Translate } from "lib/i18n/translate";

import type { JudgedRun } from "../services/exerciseGoals.service";
import { GOAL_CLEAN_RUNS_REQUIRED, STRICTNESS_ACCURACY } from "./goalRules";

export interface JudgedRunNotice {
  tone: "success" | "neutral";
  title: string;
  description?: string;
}

/**
 * What a run played outside goal mode did to its goal, said in one toast — the
 * session has no goal summary of its own there. `t` reads the goals namespace.
 */
export const judgedRunNotice = (
  { goal, outcome }: JudgedRun,
  accuracy: number,
  t: Translate,
): JudgedRunNotice | null => {
  if (outcome.reason === "goal_closed") return null;
  if (outcome.justCompleted) {
    return {
      tone: "success",
      title: t("verdict.completed", { bpm: goal.targetBpm }),
    };
  }
  if (outcome.stageCleared) {
    return {
      tone: "success",
      title: t("verdict.stage_cleared", { bpm: outcome.stageBpm }),
      description:
        outcome.nextStageBpm !== null
          ? t("practice_run.next_stage", { bpm: outcome.nextStageBpm })
          : undefined,
    };
  }
  if (outcome.clean) {
    return {
      tone: "success",
      title: t("practice_run.clean", {
        bpm: outcome.stageBpm,
        count: outcome.cleanRuns,
        required: GOAL_CLEAN_RUNS_REQUIRED,
      }),
    };
  }
  const missed = t("verdict.accuracy", {
    accuracy,
    required: STRICTNESS_ACCURACY[goal.strictness],
  });
  return {
    tone: "neutral",
    title: t("practice_run.not_clean", { bpm: outcome.stageBpm }),
    description: outcome.streakReset
      ? `${missed} ${t("verdict.streak_reset")}`
      : missed,
  };
};
