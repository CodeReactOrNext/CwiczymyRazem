import { useQuery } from "@tanstack/react-query";
import { GoalRunsChart } from "feature/exerciseGoals/components/GoalRunsChart";
import { exerciseRunsKey } from "feature/exerciseGoals/hooks/useExerciseGoals";
import { getExerciseRuns } from "feature/exerciseGoals/services/exerciseGoals.service";
import type { ScoredRun } from "feature/exercisePlan/types/exercise.types";
import { selectUserAuth } from "feature/user/store/userSlice";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { TrendingUp } from "lucide-react";
import { useAppSelector } from "store/hooks";

/** Two runs are a comparison, not a trend — the chart waits for a third. */
export const MIN_RECENT_RUNS = 3;

/**
 * The exercise to chart: the session's only scored one, when it has a tempo.
 * A session of several exercises gets no chart at all.
 */
export const soleExerciseWithTempo = (runs: ScoredRun[]): ScoredRun | null => {
  const ids = new Set(runs.map((run) => run.exerciseId));
  if (ids.size !== 1) return null;
  return runs.find((run) => run.bpm !== undefined) ?? null;
};

/**
 * How the session's exercise went over its last scored runs — tempo and
 * accuracy, run by run — once it has enough runs to show a trend.
 */
export const RecentRunsCard = ({ runs }: { runs: ScoredRun[] }) => {
  const { t } = useTranslation("session_summary");
  const uid = useAppSelector(selectUserAuth);
  const run = soleExerciseWithTempo(runs);
  const exerciseId = run?.exerciseId ?? "";

  // Same key as the goal charts, so a chart already open this session is reused
  // and refetched with the run just saved.
  const { data: history } = useQuery({
    queryKey: exerciseRunsKey(uid, exerciseId),
    queryFn: () => getExerciseRuns(uid!, exerciseId),
    enabled: !!uid && !!run,
  });

  if (!run || !history || history.length < MIN_RECENT_RUNS) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className='rounded-lg bg-zinc-900/40 p-7 md:p-8'>
      <div className='mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
        <div className='flex items-center gap-2'>
          <TrendingUp className='h-4 w-4 text-zinc-400' aria-hidden />
          <h3 className='text-sm font-semibold text-zinc-300'>
            {t("recent_runs.title")}
          </h3>
        </div>
        <span className='text-xs tabular-nums text-zinc-500'>
          {t("recent_runs.runs", {
            count: history.length,
            from: history[0].bpm,
            to: history[history.length - 1].bpm,
          })}
        </span>
      </div>
      <GoalRunsChart runs={history} showTempo showAccuracy />
    </motion.div>
  );
};
