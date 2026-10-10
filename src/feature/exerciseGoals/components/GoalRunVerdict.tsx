import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Check, Loader2, MicOff, Target, X } from "lucide-react";

import type {
  ExerciseGoal,
  GoalRunInput,
  GoalRunOutcome,
} from "../types/exerciseGoal.types";
import {
  GOAL_CLEAN_RUNS_REQUIRED,
  STRICTNESS_ACCURACY,
} from "../utils/goalRules";
import { GoalProgressDots } from "./GoalProgressDots";

export type GoalRunVerdictState =
  | { kind: "saving" }
  | { kind: "not_scored" }
  | { kind: "error" }
  | {
      kind: "judged";
      goal: ExerciseGoal;
      run: GoalRunInput;
      outcome: GoalRunOutcome;
    };

/**
 * What a goal-mode run did to the goal — shown in the run summary, under the
 * accuracy stats the summary already has.
 */
export const GoalRunVerdict = ({ state }: { state: GoalRunVerdictState }) => {
  const { t } = useTranslation("goals");

  if (state.kind === "saving") {
    return (
      <p className='flex items-center gap-2 text-sm text-zinc-400'>
        <Loader2 className='h-4 w-4 animate-spin' />
        {t("verdict.saving")}
      </p>
    );
  }

  if (state.kind === "not_scored" || state.kind === "error") {
    return (
      <div className='flex items-start gap-3 rounded-lg bg-zinc-800/40 px-4 py-4'>
        <MicOff className='mt-0.5 h-4 w-4 shrink-0 text-zinc-400' />
        <p className='text-sm text-zinc-300'>
          {t(state.kind === "error" ? "verdict.error" : "verdict.not_scored")}
        </p>
      </div>
    );
  }

  const { goal, run, outcome } = state;
  const reached = outcome.justCompleted;

  const headline = reached
    ? t("verdict.completed", { bpm: goal.targetBpm })
    : outcome.reason === "goal_closed"
      ? t("verdict.closed")
      : outcome.clean
        ? t("verdict.clean")
        : t("verdict.not_clean");

  const detail = reached
    ? null
    : outcome.reason === "too_slow"
      ? t("verdict.too_slow", { bpm: run.bpm, target: goal.targetBpm })
      : outcome.reason === "accuracy"
        ? t("verdict.accuracy", {
            accuracy: run.accuracy,
            required: STRICTNESS_ACCURACY[goal.strictness],
          })
        : null;

  return (
    <div
      className={cn(
        "rounded-lg px-4 py-4",
        reached ? "bg-emerald-500/10" : "bg-zinc-800/40",
      )}>
      <div
        className={cn(
          "flex gap-3",
          detail || outcome.streakReset ? "items-start" : "items-center",
        )}>
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded",
            outcome.clean
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-zinc-800 text-zinc-400",
          )}>
          {reached ? (
            <Target className='h-4 w-4' />
          ) : outcome.clean ? (
            <Check className='h-4 w-4' />
          ) : (
            <X className='h-4 w-4' />
          )}
        </span>
        <div className='min-w-0 space-y-1'>
          <p
            className={cn(
              "text-sm font-semibold",
              reached ? "text-emerald-300" : "text-zinc-100",
            )}>
            {headline}
          </p>
          {detail && <p className='text-sm text-zinc-400'>{detail}</p>}
          {outcome.streakReset && (
            <p className='text-sm text-zinc-400'>{t("verdict.streak_reset")}</p>
          )}
        </div>
      </div>
      {outcome.reason !== "goal_closed" && (
        <div className='mt-4 flex items-center gap-3'>
          <GoalProgressDots cleanRuns={outcome.cleanRuns} />
          <span className='text-xs text-zinc-400'>
            {t("card.progress", {
              count: outcome.cleanRuns,
              total: GOAL_CLEAN_RUNS_REQUIRED,
            })}
          </span>
        </div>
      )}
    </div>
  );
};
