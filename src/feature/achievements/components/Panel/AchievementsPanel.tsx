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
import { AchievementTile } from "./AchievementTile";

/** Rarity meters reuse the themer's achievement colours as bar fills. */
const RARITY_BAR: Record<AchievementRarityTally["rarity"], string> = {
  common: "bg-zinc-300",
  rare: "bg-achievements-rare",
  veryRare: "bg-achievements-veryRare",
  epic: "bg-purple-400",
};

// Tiles read left to right — badge, then name and progress — so the columns are
// wider and fewer than a bare icon grid would want.
const TILE_GRID =
  "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";

const Tiles = ({
  entries,
  context,
}: {
  entries: AchievementPanelEntry[];
  context: AchievementContext | null;
}) => (
  <div className={TILE_GRID}>
    {entries.map((entry) => (
      <AchievementTile key={entry.data.id} entry={entry} context={context} />
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
  const percent = block.total > 0 ? (block.owned / block.total) * 100 : 0;

  return (
    <section className='flex flex-col gap-3'>
      <div className='flex items-center gap-3'>
        <h4 className='text-sm font-bold text-zinc-100'>
          {t(achievementCategoryKey(block.category))}
        </h4>
        <span className='text-xs tabular-nums text-zinc-500'>
          {block.owned}/{block.total}
        </span>
        <div className='h-[3px] min-w-10 flex-1 overflow-hidden rounded-full bg-white/5'>
          <div className='h-full rounded-full bg-zinc-600' style={{ width: `${percent}%` }} />
        </div>
      </div>
      <Tiles entries={block.entries} context={context} />
    </section>
  );
};

/**
 * The whole collection, on the Progress page.
 *
 * Deliberately not wrapped in a card of its own: the tiles are the cards, and
 * the styleguide allows exactly one card level on mobile. Sections are separated
 * by space rather than rules for the same reason.
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

  return (
    <div className='flex flex-col gap-8'>
      <div className='flex flex-wrap items-end gap-x-12 gap-y-6'>
        <div>
          <p className='text-4xl font-bold leading-none tabular-nums text-zinc-100'>
            {state.owned}
            <span className='text-xl text-zinc-500'> / {state.total}</span>
          </p>
          <p className='mt-1 text-xs text-zinc-500'>{t("panel.totalCaption")}</p>
        </div>

        <div className='flex min-w-[16rem] flex-1 flex-col gap-2'>
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
        <section className='flex flex-col gap-3'>
          <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
            <h4 className='text-base font-bold text-cyan-400'>{t("panel.readyTitle")}</h4>
            <p className='text-xs text-zinc-400'>
              {t("panel.readySubtitle", { count: state.ready.length })}
            </p>
          </div>
          <Tiles entries={state.ready} context={context} />
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
