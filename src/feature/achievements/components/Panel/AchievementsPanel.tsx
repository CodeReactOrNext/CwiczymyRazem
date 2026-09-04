import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { useMemo } from "react";

import { achievementCategoryKey } from "../../data/achievementCategories";
import { useAchievementContext } from "../../hooks/useAchievementContext";
import type { AchievementContext, AchievementList } from "../../types";
import type {
  AchievementPanelCategory,
  AchievementPanelEntry,
  AchievementRarityTally,
} from "../../utils/achievementPanelState";
import { buildAchievementPanelState } from "../../utils/achievementPanelState";
import { AchievementRow } from "./AchievementRow";

/** Rarity meters reuse the themer's achievement colours as bar fills. */
const RARITY_BAR: Record<AchievementRarityTally["rarity"], string> = {
  common: "bg-zinc-300",
  rare: "bg-achievements-rare",
  veryRare: "bg-achievements-veryRare",
  epic: "bg-purple-400",
};

const Rows = ({
  entries,
  context,
}: {
  entries: AchievementPanelEntry[];
  context: AchievementContext | null;
}) => (
  <div className='flex flex-col gap-1.5'>
    {entries.map((entry) => (
      <AchievementRow key={entry.data.id} entry={entry} context={context} />
    ))}
  </div>
);

const CategoryBlock = ({
  block,
  context,
}: {
  block: AchievementPanelCategory;
  context: AchievementContext | null;
}) => {
  const { t } = useTranslation("achievements");

  return (
    <section className='flex flex-col gap-2'>
      <div className='flex items-baseline gap-3 px-1'>
        <h4 className='text-sm font-bold text-zinc-100'>
          {t(achievementCategoryKey(block.category))}
        </h4>
        <span className='flex-1 text-xs tabular-nums text-zinc-500'>
          {block.owned}/{block.total}
        </span>
        <span className='shrink-0 text-[0.6875rem] text-zinc-500'>
          {t("panel.globalColumn")}
        </span>
      </div>
      <Rows entries={block.entries} context={context} />
    </section>
  );
};

/**
 * The whole collection.
 *
 * Deliberately not wrapped in a card of its own: the rows are the cards, and the
 * styleguide allows exactly one card level on mobile. Sections are separated by
 * space rather than rules for the same reason.
 */
export const AchievementsPanel = ({
  userAchievements,
}: {
  userAchievements: AchievementList[];
}) => {
  const { t } = useTranslation("achievements");
  const context = useAchievementContext();

  const state = useMemo(
    () => buildAchievementPanelState(userAchievements, context),
    [userAchievements, context]
  );

  const earnedPercent = state.total > 0 ? Math.round((state.owned / state.total) * 100) : 0;

  return (
    <div className='flex flex-col gap-8'>
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

      {state.ready.length > 0 && (
        <section className='flex flex-col gap-2'>
          <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1 px-1'>
            <h4 className='text-base font-bold text-cyan-400'>{t("panel.readyTitle")}</h4>
            <p className='text-xs text-zinc-400'>
              {t("panel.readySubtitle", { count: state.ready.length })}
            </p>
          </div>
          <Rows entries={state.ready} context={context} />
        </section>
      )}

      <div className='flex flex-col gap-8'>
        {state.categories.map((block) => (
          <CategoryBlock key={block.category} block={block} context={context} />
        ))}
      </div>
    </div>
  );
};
