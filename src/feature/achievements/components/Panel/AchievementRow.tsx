import { cn } from "assets/lib/utils";
import { RewardBadge } from "components/Rewards/RewardBadge";
import { useTranslation } from "hooks/useTranslation";
import { Check } from "lucide-react";
import { memo } from "react";

import type { AchievementReward } from "../../data/achievementRewards";
import type {
  AchievementContext,
  AchievementEntryState,
  AchievementList,
} from "../../types";
import type { AchievementPanelEntry } from "../../utils/achievementPanelState";
import { AchievementCard } from "../Card/AchievementCard";

/**
 * One badge, as a row.
 *
 * The row is its own bar chart: the fill behind it runs to the share of players
 * who hold the badge, so the list is readable as a shape before a single number
 * is — long bars at the top, slivers at the bottom.
 *
 * The badge art is `AchievementCard`, exactly as the post-session popup, the
 * Achievements Map and the public profile render it, so a badge looks and
 * behaves the same everywhere and its tooltip and mobile dialog come for free.
 */

/**
 * Earned or not is the first thing to read off a row, so it is said four times
 * over: a green tick, a green bar, full-colour art and the brightest text on the
 * row. Everything unearned is grey and desaturated, and its bar sits close to
 * the surface behind it.
 *
 * Green rather than the brand accent: the styleguide gives emerald to "done",
 * and cyan is already spoken for by the badges a player can go and finish now.
 *
 * Unearned rows sit closer to the page behind them than to an earned one. Only
 * their surfaces and bars are dimmed, never the text on them: darkening the
 * ground raises the contrast of what is written on it, so the row recedes while
 * staying as readable as it was.
 */
const SURFACE: Record<AchievementEntryState, string> = {
  owned: "bg-zinc-800/40",
  ready: "bg-zinc-900/40",
  progress: "bg-zinc-900/25",
  locked: "bg-zinc-900/15",
};

const FILL: Record<AchievementEntryState, string> = {
  owned: "bg-emerald-500/[0.09]",
  ready: "bg-cyan-500/10",
  progress: "bg-zinc-700/20",
  locked: "bg-zinc-800/25",
};

const NAME: Record<AchievementEntryState, string> = {
  owned: "text-zinc-50",
  ready: "text-cyan-300",
  progress: "text-zinc-300",
  locked: "text-zinc-400",
};

const DESCRIPTION: Record<AchievementEntryState, string> = {
  owned: "text-zinc-400",
  ready: "text-zinc-400",
  progress: "text-zinc-500",
  locked: "text-zinc-500",
};

const PERCENT: Record<AchievementEntryState, string> = {
  owned: "text-zinc-200",
  ready: "text-zinc-300",
  progress: "text-zinc-400",
  locked: "text-zinc-500",
};

export const AchievementRow = memo(
  ({
    entry,
    context,
    reward,
    isClaimed = false,
    isClaiming = false,
    onClaim,
  }: {
    entry: AchievementPanelEntry;
    context: AchievementContext | null;
    /** What this badge pays. Absent while the ledger is still loading. */
    reward?: AchievementReward | null;
    isClaimed?: boolean;
    isClaiming?: boolean;
    onClaim?: (id: AchievementList) => void;
  }) => {
    const { t } = useTranslation("achievements");
    const { data, state, progress, globalRate } = entry;

    const isOwned = state === "owned";
    const canClaim = isOwned && !isClaimed && Boolean(reward);
    const percent = progress && progress.max > 0 ? (progress.current / progress.max) * 100 : 0;

    // `hover:z-10` so the badge, which grows to 2.2x under the pointer, comes up
    // over the rows below it rather than under them.
    return (
      <div className={cn("relative rounded-lg transition-colors hover:z-10", SURFACE[state])}>
        {/*
          The clip lives on the bar rather than on the row. It is only here to
          keep the fill inside the rounded corners, and on the row it also cut
          the badge off the moment it grew past the row's edge.
        */}
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 overflow-hidden rounded-lg'>
          <div
            className={cn("absolute inset-y-0 left-0", FILL[state])}
            style={{ width: `${globalRate}%` }}
          />
        </div>

        <div className='relative flex items-center gap-3 p-2.5 pr-3 sm:gap-4 sm:p-3'>
          {/* The tick column keeps its width either way, so names stay aligned. */}
          <span className='flex w-4 shrink-0 justify-center'>
            {isOwned && (
              <Check className='h-4 w-4 text-emerald-400' aria-label={t("panel.earned")} />
            )}
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
            <p className={cn("text-xs leading-snug", DESCRIPTION[state])}>
              {t(`${data.id}.description`)}
            </p>

            {state === "ready" && (
              <span className='mt-1 text-[0.6875rem] font-semibold leading-none text-cyan-400'>
                {t("panel.readyHint")}
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

          {/*
            The payout itself stays behind this glyph. Spelled out on the row it
            was three coloured chips apiece across the whole list, which buried
            the two things the list is actually read for.
          */}
          {reward && (
            <RewardBadge reward={reward} earned={isOwned} claimed={isClaimed} />
          )}

          {canClaim && (
            <button
              onClick={() => onClaim?.(data.id)}
              disabled={isClaiming}
              className={cn(
                "shrink-0 rounded-lg bg-zinc-100 px-3 py-1.5 text-[0.6875rem] font-bold capitalize tracking-wide text-zinc-900 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                isClaiming && "cursor-wait opacity-70",
              )}>
              {t("panel.rewards.claim")}
            </button>
          )}

          <span className={cn("shrink-0 text-sm font-bold tabular-nums", PERCENT[state])}>
            {globalRate.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  }
);

AchievementRow.displayName = "AchievementRow";
