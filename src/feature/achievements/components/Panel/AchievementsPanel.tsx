import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { useMemo } from "react";

import { useAchievementContext } from "../../hooks/useAchievementContext";
import { useAchievementStats } from "../../hooks/useAchievementStats";
import type { AchievementList } from "../../types";
import type { AchievementRarityTally } from "../../utils/achievementPanelState";
import { buildAchievementPanelState } from "../../utils/achievementPanelState";
import { AchievementRow } from "./AchievementRow";

/** Rarity meters reuse the themer's achievement colours as bar fills. */
const RARITY_BAR: Record<AchievementRarityTally["rarity"], string> = {
  common: "bg-zinc-300",
  rare: "bg-achievements-rare",
  veryRare: "bg-achievements-veryRare",
  epic: "bg-purple-400",
};

/**
 * The whole collection: one list, commonest badge first.
 *
 * Not grouped. A badge's rarity is already on its art, how far along it is is
 * already on its row, and the share of players who hold it is the column the
 * list is ordered by — so sections would only break the one ordering that
 * carries information.
 *
 * Deliberately not wrapped in a card of its own: the rows are the cards, and the
 * styleguide allows exactly one card level on mobile.
 */
export const AchievementsPanel = ({
  userAchievements,
}: {
  userAchievements: AchievementList[];
}) => {
  const { t } = useTranslation("achievements");
  const context = useAchievementContext();
  const { data: stats } = useAchievementStats();

  const state = useMemo(
    () => buildAchievementPanelState(userAchievements, context, stats ?? null),
    [userAchievements, context, stats]
  );

  const earnedPercent = state.total > 0 ? Math.round((state.owned / state.total) * 100) : 0;

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-5 rounded-lg bg-zinc-900/40 p-5'>
        <div className='flex flex-col gap-2'>
          <div className='flex items-baseline justify-between gap-4'>
            <p className='text-sm font-bold text-zinc-200'>
              {t("panel.earnedHeadline", { owned: state.owned, total: state.total })}
            </p>
            <span className='shrink-0 text-sm font-bold tabular-nums text-zinc-400'>
              ({earnedPercent}%)
            </span>
          </div>
          <div className='h-2 overflow-hidden rounded-full bg-zinc-800'>
            <div
              className='h-full rounded-full bg-cyan-500'
              style={{ width: `${earnedPercent}%` }}
            />
          </div>
        </div>

        <div className='flex flex-col gap-2'>
          {state.rarities.map(({ rarity, owned, total }) => (
            <div key={rarity} className='flex items-center gap-3'>
              <span className='w-24 shrink-0 text-xs text-zinc-400'>{t(rarity)}</span>
              <div className='h-[5px] flex-1 overflow-hidden rounded-full bg-white/5'>
                <div
                  className={cn("h-full rounded-full", RARITY_BAR[rarity])}
                  style={{ width: `${total > 0 ? (owned / total) * 100 : 0}%` }}
                />
              </div>
              <span className='w-12 shrink-0 text-right text-xs tabular-nums text-zinc-500'>
                {owned}/{total}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        <div className='flex justify-end px-1'>
          <span className='text-[0.6875rem] text-zinc-500'>{t("panel.globalColumn")}</span>
        </div>

        <div className='flex flex-col gap-1.5'>
          {state.entries.map((entry) => (
            <AchievementRow key={entry.data.id} entry={entry} context={context} />
          ))}
        </div>
      </div>
    </div>
  );
};
