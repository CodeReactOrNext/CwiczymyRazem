import { Tooltip, TooltipContent, TooltipTrigger } from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { memo } from "react";

import type { AchievementTileState } from "../../types";
import type { AchievementPanelEntry } from "../../utils/achievementPanelState";

/**
 * A tile that can be read without being hovered.
 *
 * The old grid was 77 anonymous squares whose meaning lived only in a tooltip,
 * so finding what was close to unlocking meant pointing at every one of them.
 * The name and the progress are on the face; the tooltip is now only for the
 * flavour text.
 */

/** Rarity tints an earned tile's icon — the colours come from the themer. */
const RARITY_ICON: Record<AchievementPanelEntry["data"]["rarity"], string> = {
  common: "text-zinc-300",
  rare: "text-achievements-rare",
  veryRare: "text-achievements-veryRare",
  epic: "text-purple-400",
};

const SURFACE: Record<AchievementTileState, string> = {
  owned: "bg-zinc-800/40 hover:bg-zinc-800/70",
  ready: "bg-cyan-500/10 hover:bg-cyan-500/20",
  progress: "bg-zinc-900/60 hover:bg-zinc-800/60",
  locked: "bg-zinc-900/40 hover:bg-zinc-800/40",
};

const NAME: Record<AchievementTileState, string> = {
  owned: "text-zinc-100",
  ready: "text-cyan-400",
  progress: "text-zinc-300",
  locked: "text-zinc-500",
};

export const AchievementTile = memo(({ entry }: { entry: AchievementPanelEntry }) => {
  const { t } = useTranslation("achievements");
  const { data, state, progress } = entry;
  const { Icon } = data;

  const iconColor =
    state === "owned"
      ? RARITY_ICON[data.rarity]
      : state === "ready"
        ? "text-cyan-400"
        : "text-zinc-600";

  const percent = progress && progress.max > 0 ? (progress.current / progress.max) * 100 : 0;

  return (
    <Tooltip delayDuration={120}>
      <TooltipTrigger asChild>
        <div
          tabIndex={0}
          className={cn(
            "flex min-h-[5.75rem] flex-col gap-2 rounded-lg p-3 transition-colors",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            SURFACE[state]
          )}>
          <Icon className={cn("h-4 w-4 shrink-0", iconColor)} aria-hidden />

          <p className={cn("text-xs font-semibold leading-tight", NAME[state])}>
            {t(`${data.id}.title`)}
          </p>

          <div className='mt-auto'>
            {state === "ready" && (
              <span className='text-[0.6875rem] text-cyan-400/80'>
                {t("panel.conditionMet")}
              </span>
            )}

            {state === "progress" && progress && (
              <div className='flex items-center gap-2'>
                <div className='h-[3px] flex-1 overflow-hidden rounded-full bg-white/10'>
                  <div
                    className='h-full rounded-full bg-cyan-500'
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className='text-[0.6875rem] tabular-nums text-zinc-500'>
                  {progress.current}/{progress.max}
                </span>
              </div>
            )}

            {state === "locked" && (
              <span className='text-[0.6875rem] text-zinc-600'>{t("panel.stillLocked")}</span>
            )}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side='top' className='max-w-[15rem] bg-zinc-800 text-zinc-100'>
        <p className='text-xs font-semibold'>{t(`${data.id}.title`)}</p>
        <p className='mt-0.5 text-xs text-zinc-400'>{t(`${data.id}.description`)}</p>
      </TooltipContent>
    </Tooltip>
  );
});

AchievementTile.displayName = "AchievementTile";
