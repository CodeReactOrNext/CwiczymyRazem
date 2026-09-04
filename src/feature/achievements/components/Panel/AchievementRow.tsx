import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Check } from "lucide-react";
import { memo } from "react";

import type { AchievementContext, AchievementEntryState } from "../../types";
import type { AchievementPanelEntry } from "../../utils/achievementPanelState";
import { AchievementCard } from "../Card/AchievementCard";

/**
 * One badge, as a row.
 *
 * The row is its own bar chart: the fill behind it runs to the share of players
 * who hold the badge, so the commonest sit as long bars at the top of a category
 * and the rarest as slivers at the bottom — the list is readable as a shape
 * before a single number is.
 *
 * The badge art is `AchievementCard`, exactly as the post-session popup, the
 * Achievements Map and the public profile render it, so a badge looks and
 * behaves the same everywhere and its tooltip and mobile dialog come for free.
 */

const NAME: Record<AchievementEntryState, string> = {
  owned: "text-zinc-100",
  ready: "text-cyan-300",
  progress: "text-zinc-200",
  locked: "text-zinc-400",
};

/** The fill is a backdrop, so it stays well under the text it sits behind. */
const FILL: Record<AchievementEntryState, string> = {
  owned: "bg-zinc-700/40",
  ready: "bg-cyan-500/10",
  progress: "bg-zinc-800/50",
  locked: "bg-zinc-800/40",
};

export const AchievementRow = memo(
  ({
    entry,
    context,
  }: {
    entry: AchievementPanelEntry;
    context: AchievementContext | null;
  }) => {
    const { t } = useTranslation("achievements");
    const { data, state, progress, globalRate } = entry;

    const isOwned = state === "owned";
    const percent = progress && progress.max > 0 ? (progress.current / progress.max) * 100 : 0;

    return (
      <div className='relative overflow-hidden rounded-lg bg-zinc-900/40'>
        <div
          aria-hidden
          className={cn("absolute inset-y-0 left-0", FILL[state])}
          style={{ width: `${globalRate}%` }}
        />

        <div className='relative flex items-center gap-3 p-2.5 pr-3 sm:gap-4 sm:p-3'>
          {/* The tick column keeps its width either way, so names stay aligned. */}
          <span className='flex w-4 shrink-0 justify-center'>
            {isOwned && <Check className='h-4 w-4 text-zinc-400' aria-label='Earned' />}
          </span>

          {/*
            Locked badges are desaturated so a rarity colour never hints at a
            badge the player does not hold. `ready` keeps its colour: the
            requirement is met, only the report is missing.
          */}
          <div className={cn(!isOwned && state !== "ready" && "grayscale")}>
            <AchievementCard
              id={data.id}
              data={data}
              context={context}
              isUnlocked={isOwned}
              showProgress={state === "progress"}
            />
          </div>

          <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
            <p className={cn("text-sm font-bold leading-tight", NAME[state])}>
              {t(`${data.id}.title`)}
            </p>
            <p className='text-xs leading-snug text-zinc-500'>{t(`${data.id}.description`)}</p>

            {state === "ready" && (
              <span className='mt-1 text-[0.6875rem] leading-none text-cyan-400/80'>
                {t("panel.conditionMet")}
              </span>
            )}

            {state === "progress" && progress && (
              <div className='mt-1.5 flex max-w-[14rem] items-center gap-2'>
                <div className='h-[3px] min-w-0 flex-1 overflow-hidden rounded-full bg-white/10'>
                  <div
                    className='h-full rounded-full bg-cyan-500/70'
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className='shrink-0 text-[0.6875rem] leading-none tabular-nums text-zinc-500'>
                  {progress.current}/{progress.max}
                </span>
              </div>
            )}
          </div>

          <span className='shrink-0 text-sm font-bold tabular-nums text-zinc-300'>
            {globalRate.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  }
);

AchievementRow.displayName = "AchievementRow";
