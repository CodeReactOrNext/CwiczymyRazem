import { cn } from "assets/lib/utils";
import { PartIcon } from "feature/arsenal/components/Parts/PartIcon";
import { ModArt } from "feature/arsenal/components/Workshop/ModArt";
import { PART_TIER_COLORS } from "feature/arsenal/data/partDefinitions";
import type { DailyExercisePrize } from "feature/dailyExercise/types/dailyExercise.types";
import { useTranslation } from "hooks/useTranslation";

/**
 * What today's #1 takes home, as one item row like the songs on the Monthly
 * Challenge card: the art in a thumbnail, the label above the name.
 */
export const DailyPrize = ({ prize, className }: { prize: DailyExercisePrize; className?: string }) => {
  const { t } = useTranslation("dashboard");
  return (
  <section className={cn("flex min-w-0 items-center gap-3", className)}>
    <div className='flex size-14 shrink-0 items-center justify-center rounded bg-zinc-800'>
      <div className='size-12'>
        {prize.kind === "mod" ? <ModArt modId={prize.featureId} /> : <PartIcon partId={prize.partId} />}
      </div>
    </div>

    <div className='min-w-0'>
      <h5 className='text-xs text-zinc-400'>
        {t("daily_exercise.prize")}
      </h5>
      {prize.kind === "mod" ? (
        <p className='mt-1 flex flex-wrap items-baseline gap-x-2'>
          <span className='text-sm font-semibold text-zinc-100'>{t("daily_exercise.mod", { label: prize.label })}</span>
          <span className='text-xs font-medium tabular-nums text-zinc-400'>
            +{prize.points} {prize.statLabel}
          </span>
        </p>
      ) : (
        <p className='mt-1 text-sm font-semibold text-zinc-100'>
          <span style={{ color: PART_TIER_COLORS[prize.tier] }}>{prize.tier}</span> {prize.label}
        </p>
      )}
    </div>
  </section>
  );
};
