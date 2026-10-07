import { cn } from "assets/lib/utils";
import { PartIcon } from "feature/arsenal/components/Parts/PartIcon";
import { ModArt } from "feature/arsenal/components/Workshop/ModArt";
import { PART_TIER_COLORS } from "feature/arsenal/data/partDefinitions";
import type { DailyExercisePrize } from "feature/dailyExercise/types/dailyExercise.types";
import { useTranslation } from "hooks/useTranslation";
import { Gift } from "lucide-react";

/**
 * What today's #1 takes home — a panel of its own beside the board, titled like
 * it, with the mod or part's art large enough to want.
 */
export const DailyPrize = ({ prize, className }: { prize: DailyExercisePrize; className?: string }) => {
  const { t } = useTranslation("dashboard");
  return (
  <section className={cn("flex min-w-0 flex-col lg:rounded-lg lg:bg-zinc-900/40 lg:p-4", className)}>
    <h5 className='flex items-center gap-2 px-3 text-sm font-semibold text-zinc-200'>
      <Gift size={14} className='shrink-0 text-amber-400' />
      {t("daily_exercise.prize")}
    </h5>

    <div className='flex flex-1 flex-col items-center justify-center gap-4 px-3 py-5 text-center'>
      <div className='flex size-28 shrink-0 items-center justify-center rounded-lg bg-zinc-800/60'>
        <div className='size-24'>
          {prize.kind === "mod" ? <ModArt modId={prize.featureId} /> : <PartIcon partId={prize.partId} />}
        </div>
      </div>

      {prize.kind === "mod" ? (
        <div className='min-w-0'>
          <p className='text-base font-semibold text-zinc-100'>{t("daily_exercise.mod", { label: prize.label })}</p>
          <p className='mt-1 text-sm font-medium tabular-nums text-zinc-400'>
            +{prize.points} {prize.statLabel}
          </p>
        </div>
      ) : (
        <div className='min-w-0'>
          <p className='text-base font-semibold text-zinc-100'>
            <span style={{ color: PART_TIER_COLORS[prize.tier] }}>{prize.tier}</span> {prize.label}
          </p>
        </div>
      )}
    </div>
  </section>
  );
};
