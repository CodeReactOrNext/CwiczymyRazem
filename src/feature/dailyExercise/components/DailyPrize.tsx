import { cn } from "assets/lib/utils";
import { PartIcon } from "feature/arsenal/components/Parts/PartIcon";
import { ModArt } from "feature/arsenal/components/Workshop/ModArt";
import { PART_TIER_COLORS } from "feature/arsenal/data/partDefinitions";
import type { DailyExercisePrize } from "feature/dailyExercise/types/dailyExercise.types";
import { useTranslation } from "hooks/useTranslation";

/** What today's #1 takes home, as art in a thumbnail — the card's lead image. */
export const DailyPrizeArt = ({ prize, className }: { prize: DailyExercisePrize; className?: string }) => {
  const { t } = useTranslation("dashboard");
  return (
    <div
      role='img'
      aria-label={t("daily_exercise.prize")}
      title={t("daily_exercise.prize")}
      className={cn("flex size-14 shrink-0 items-center justify-center rounded bg-zinc-800", className)}>
      <div className='size-12'>
        {prize.kind === "mod" ? <ModArt modId={prize.featureId} /> : <PartIcon partId={prize.partId} />}
      </div>
    </div>
  );
};

/** The prize by name, inline: a part in its tier colour, a mod with what it raises. */
export const DailyPrizeName = ({ prize }: { prize: DailyExercisePrize }) => {
  const { t } = useTranslation("dashboard");
  return prize.kind === "mod" ? (
    <>
      <span className='font-semibold text-zinc-100'>{t("daily_exercise.mod", { label: prize.label })}</span>{" "}
      <span className='tabular-nums'>
        +{prize.points} {prize.statLabel}
      </span>
    </>
  ) : (
    <span className='font-semibold text-zinc-100'>
      <span style={{ color: PART_TIER_COLORS[prize.tier] }}>{prize.tier}</span> {prize.label}
    </span>
  );
};
