import { cn } from "assets/lib/utils";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useAppSelector } from "store/hooks";

import { useExerciseRuns } from "../hooks/useExerciseGoals";
import { RUN_HISTORY_LIMIT } from "../utils/goalRules";
import { GoalRunsChart } from "./GoalRunsChart";

interface RunHistoryProps {
  exerciseId: string;
  /** Where the axis may start before there are runs — the exercise's own floor. */
  floorBpm?: number;
}

type Series = "tempo" | "accuracy";

const SERIES: { key: Series; label: string; marker: string }[] = [
  {
    key: "tempo",
    label: "chart.metric_tempo",
    marker: "h-1.5 w-1.5 rounded-full bg-zinc-400",
  },
  {
    key: "accuracy",
    label: "chart.accuracy_line",
    marker: "w-3 border-t-2 border-amber-400/75",
  },
];

/**
 * The exercise's last scored runs, goal or not: the tempo each was played at
 * and its accuracy, each line switchable, with the runs a goal judged marked
 * clean or not.
 */
export const RunHistory = ({ exerciseId, floorBpm }: RunHistoryProps) => {
  const { t } = useTranslation("goals");
  const uid = useAppSelector(selectUserAuth);
  const { data: runs, isLoading } = useExerciseRuns(uid, exerciseId);
  const [shown, setShown] = useState<Record<Series, boolean>>({
    tempo: true,
    accuracy: true,
  });

  if (!uid) return null;

  const toggle = (key: Series) =>
    setShown((current) => ({ ...current, [key]: !current[key] }));

  return (
    <section className='space-y-3'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h3 className='text-sm font-semibold text-zinc-100'>
            {t("history.title")}
          </h3>
          <p className='mt-1 text-xs text-zinc-400'>
            {t("history.hint", { count: RUN_HISTORY_LIMIT })}
          </p>
        </div>
        <div className='flex gap-1 rounded-lg bg-zinc-800/50 p-1'>
          {SERIES.map(({ key, label, marker }) => {
            const isOn = shown[key];
            // The last line on stays on — an empty chart says nothing.
            const isLast =
              isOn && SERIES.every((s) => s.key === key || !shown[s.key]);
            return (
              <button
                key={key}
                type='button'
                aria-pressed={isOn}
                disabled={isLast}
                onClick={() => toggle(key)}
                className={cn(
                  "flex items-center gap-2 rounded px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:cursor-default",
                  isOn
                    ? "bg-zinc-700 font-semibold text-zinc-100"
                    : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200",
                )}>
                <span
                  className={cn(marker, !isOn && "opacity-40")}
                  aria-hidden
                />
                {t(label)}
              </button>
            );
          })}
        </div>
      </div>
      {isLoading ? (
        <p className='flex h-56 items-center justify-center gap-2 text-sm text-zinc-400'>
          <Loader2 className='h-4 w-4 animate-spin' />
          {t("history.loading")}
        </p>
      ) : (
        <GoalRunsChart
          runs={runs ?? []}
          floorBpm={floorBpm}
          showTempo={shown.tempo}
          showAccuracy={shown.accuracy}
        />
      )}
    </section>
  );
};
