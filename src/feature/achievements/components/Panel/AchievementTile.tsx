import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { memo } from "react";

import type { AchievementContext, AchievementTileState } from "../../types";
import type { AchievementPanelEntry } from "../../utils/achievementPanelState";
import { AchievementCard } from "../Card/AchievementCard";

/**
 * One badge on the collection panel.
 *
 * The badge art is `AchievementCard`, exactly as the post-session popup, the
 * Achievements Map and the public profile render it — same holo face, same tilt,
 * same hover — so a badge looks and behaves like itself everywhere, and its
 * tooltip and mobile dialog come along for free.
 *
 * What the tile adds is what the bare grid could not say — the name, and how far
 * along the badge is — so finding what is close to unlocking does not mean
 * pointing at all 77 of them.
 */

const SURFACE: Record<AchievementTileState, string> = {
  owned: "bg-zinc-800/40 hover:bg-zinc-800/60",
  ready: "bg-cyan-500/[0.07] hover:bg-cyan-500/[0.12]",
  progress: "bg-zinc-900/50 hover:bg-zinc-800/50",
  locked: "bg-zinc-900/30 hover:bg-zinc-800/30",
};

const NAME: Record<AchievementTileState, string> = {
  owned: "text-zinc-100",
  ready: "text-cyan-300",
  progress: "text-zinc-300",
  locked: "text-zinc-500",
};

export const AchievementTile = memo(
  ({
    entry,
    context,
  }: {
    entry: AchievementPanelEntry;
    context: AchievementContext | null;
  }) => {
    const { t } = useTranslation("achievements");
    const { data, state, progress } = entry;

    const percent = progress && progress.max > 0 ? (progress.current / progress.max) * 100 : 0;
    const isOwned = state === "owned";

    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-lg p-3 transition-colors",
          SURFACE[state]
        )}>
        {/*
          Locked badges are desaturated so a rarity colour never hints at a badge
          the player does not hold — but at full opacity, so the art still reads.
          `ready` keeps its colour: the requirement is met, only the report is
          missing.

          The card itself is the full collectible, hover and all: this panel is
          behind its own tab, so nothing here mounts until it is asked for.
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

        <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
          <p className={cn("text-xs font-semibold leading-snug", NAME[state])}>
            {t(`${data.id}.title`)}
          </p>

          {state === "ready" && (
            <span className='text-[0.6875rem] leading-none text-cyan-400/70'>
              {t("panel.conditionMet")}
            </span>
          )}

          {state === "progress" && progress && (
            <div className='flex items-center gap-2'>
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
      </div>
    );
  }
);

AchievementTile.displayName = "AchievementTile";
