import { AchievementPhysicalCard } from "feature/achievements/components/Card/AchievementPhysicalCard";
import { achievementsMap } from "feature/achievements/data/achievementsData";
import { achievementsRarity } from "feature/achievements/data/achievementsRarity";
import { getGlobalUnlockRate } from "feature/achievements/data/globalUnlockRate";
import { useAchievementStats } from "feature/achievements/hooks/useAchievementStats";
import type { AchievementList } from "feature/achievements/types";
import { ACHIEVEMENT_TITLES } from "feature/profile/data/achievementTitles";
import { useTranslation } from "hooks/useTranslation";
import { rateFromStats } from "lib/achievements/achievementStats";
import { useResponsiveStore } from "store/useResponsiveStore";

export const RARITY_LABELS = {
  common: "Common",
  rare: "Rare",
  veryRare: "Very rare",
  epic: "Epic",
} as const;

/** The light each rarity throws behind its card — a glow core, not a frame. */
const RARITY_LIGHT = {
  common: "rgba(161, 161, 170, 0.16)",
  rare: "rgba(177, 249, 255, 0.18)",
  veryRare: "rgba(255, 229, 76, 0.18)",
  epic: "rgba(140, 90, 255, 0.32)",
} as const;

interface TrophyCaseProps {
  trophies: AchievementList[];
  isPinned: boolean;
  isOwner: boolean;
}

/**
 * The few achievements a player wants strangers to see first. Each one is the
 * same holographic card the achievement wall uses, only big, lit from behind
 * in its rarity colour — plus how many players hold it and the title it gives.
 */
export const TrophyCase = ({ trophies, isPinned, isOwner }: TrophyCaseProps) => {
  const { t } = useTranslation("achievements");
  const { data: stats } = useAchievementStats();
  const isMobileView = useResponsiveStore((state) => state.isMobile);

  if (trophies.length === 0) return null;

  return (
    <div className='rounded-2xl bg-zinc-900/30 p-6'>
      <div className='flex flex-wrap items-end justify-between gap-2'>
        <div>
          <h2 className='text-2xl font-bold text-white'>Trophy case</h2>
          {!isPinned && (
            <p className='mt-1 text-sm text-zinc-400'>Rarest achievements</p>
          )}
        </div>
        {isOwner && !isPinned && (
          <p className='text-xs text-zinc-500'>
            Pin your own in Customize profile → Profile card.
          </p>
        )}
      </div>

      <div className='mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'>
        {trophies.map((id) => {
          const data = achievementsMap.get(id);
          if (!data) return null;
          const { Icon, rarity, name, description } = data;
          const rate =
            rateFromStats(id, stats) ?? getGlobalUnlockRate(id, rarity);
          return (
            <div
              key={id}
              title={t(description as never)}
              className='flex flex-col items-center rounded-xl bg-zinc-800/40 px-4 pb-6 pt-8 text-center'
              style={{
                backgroundImage: `radial-gradient(ellipse 75% 55% at 50% 32%, ${RARITY_LIGHT[rarity]}, transparent 75%)`,
              }}>
              <AchievementPhysicalCard
                Icon={Icon}
                rarity={rarity}
                isMobileView={isMobileView}
                cardSize='lg'
                hoverScale={1.08}
                className='h-24 w-24 rounded-2xl'
              />
              <p className='mt-6 text-sm font-semibold text-zinc-100'>
                {t(name as never)}
              </p>
              <p className='mt-1 text-xs text-zinc-500'>
                <span className={achievementsRarity[rarity].tailwindClass}>
                  {RARITY_LABELS[rarity]}
                </span>{" "}
                · {rate}% of players
              </p>
              <p className='mt-3 text-[11px] italic text-zinc-400'>
                Title: {ACHIEVEMENT_TITLES[id]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
