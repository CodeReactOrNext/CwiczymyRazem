import { useTranslation } from "hooks/useTranslation";
import { useMemo } from "react";

import { useAchievementContext } from "../../hooks/useAchievementContext";
import { useAchievementStats } from "../../hooks/useAchievementStats";
import type { AchievementList } from "../../types";
import { buildAchievementPanelState } from "../../utils/achievementPanelState";
import { AchievementRow } from "./AchievementRow";

/**
 * The whole collection: one count, then one list, commonest badge first.
 *
 * Neither grouped nor broken down by rarity. A badge's rarity is already on its
 * art, how far along it is is already on its row, and the share of players who
 * hold it is the column the list is ordered by — so a second set of bars above
 * the list only competed with the one number a player came to read.
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
      <div className='flex flex-col gap-2 rounded-lg bg-zinc-900/40 p-5'>
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
