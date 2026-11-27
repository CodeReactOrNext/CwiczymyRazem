import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { SectionHeader } from "components/SectionHeader/SectionHeader";
import { AchievementPhysicalCard } from "feature/achievements/components/Card/AchievementPhysicalCard";
import { achievementsMap } from "feature/achievements/data/achievementsData";
import { achievementsRarity } from "feature/achievements/data/achievementsRarity";
import { getGlobalUnlockRate } from "feature/achievements/data/globalUnlockRate";
import { useAchievementStats } from "feature/achievements/hooks/useAchievementStats";
import type { AchievementList } from "feature/achievements/types";
import { ACHIEVEMENT_TITLES } from "feature/profile/data/achievementTitles";
import { useTranslation } from "hooks/useTranslation";
import { rateFromStats } from "lib/achievements/achievementStats";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useResponsiveStore } from "store/useResponsiveStore";

export const RARITY_LABELS = {
  common: "Common",
  rare: "Rare",
  veryRare: "Very rare",
  epic: "Epic",
} as const;

interface TrophyCaseProps {
  trophies: AchievementList[];
  isPinned: boolean;
  isOwner: boolean;
  /** The case has the whole row to itself, so the smaller trophies go two abreast. */
  wide?: boolean;
}

/**
 * The few achievements a player wants strangers to see first. The first one
 * (the rarest, or the first pin) is the exhibit: the holographic card at full
 * size with the title it gives. The rest line up under it as rows, so a case
 * with one trophy is a finished case, not a grid with four holes.
 */
export const TrophyCase = ({
  trophies,
  isPinned,
  isOwner,
  wide = false,
}: TrophyCaseProps) => {
  const { t } = useTranslation(["achievements", "profile"]);
  const { data: stats } = useAchievementStats();
  const isMobileView = useResponsiveStore((state) => state.isMobile);

  const items = trophies.flatMap((id) => {
    const data = achievementsMap.get(id);
    if (!data) return [];
    return [
      {
        ...data,
        id,
        rate: rateFromStats(id, stats) ?? getGlobalUnlockRate(id, data.rarity),
      },
    ];
  });
  if (items.length === 0) return null;
  const [lead, ...rest] = items;

  const rarityLine = (item: (typeof items)[number]) => (
    <>
      <span
        className={cn("font-semibold", achievementsRarity[item.rarity].tailwindClass)}>
        {t(`profile:layout.rarity.${item.rarity}`, RARITY_LABELS[item.rarity])}
      </span>{" "}
      · {t("profile:cases.players_rate", { rate: item.rate })}
    </>
  );

  return (
    <Card className='h-full p-5 sm:p-6'>
      <SectionHeader
        title={t("profile:layout.sections.trophies.title")}
        description={isOwner && !isPinned && t("profile:cases.pin_hint")}
        action={
          // The wall of all badges is the owner's own page; a visitor has no
          // such page to go to.
          isOwner && (
            <Link
              href='/profile/achievements'
              className='flex items-center gap-1 text-sm font-semibold text-zinc-300 transition-colors hover:text-zinc-50'>
              {t("profile:cases.all", "All")}
              <ArrowRight aria-hidden className='h-3.5 w-3.5' />
            </Link>
          )
        }
        className='mb-0 flex-wrap'
      />

      <div
        title={t(lead.description as never)}
        className='mt-5 flex items-center gap-5 rounded-lg bg-zinc-800/40 p-5'>
        <AchievementPhysicalCard
          Icon={lead.Icon}
          rarity={lead.rarity}
          isMobileView={isMobileView}
          cardSize='lg'
          hoverScale={1.08}
          className='h-24 w-24 shrink-0 rounded-2xl'
        />
        <div className='min-w-0'>
          <p className='text-base font-bold text-zinc-50'>
            {t(lead.name as never)}
          </p>
          <p className='mt-1 text-sm text-zinc-400'>{rarityLine(lead)}</p>
          <p className='mt-2.5 text-xs text-zinc-300'>
            {t("profile:cases.title", {
              title: t(`profile:layout.titles.${lead.id}`, ACHIEVEMENT_TITLES[lead.id]),
            })}
          </p>
        </div>
      </div>

      {rest.length > 0 && (
        <ul
          className={cn(
            "mt-3 grid grid-cols-1 gap-1",
            wide && "sm:grid-cols-2",
          )}>
          {rest.map((item) => (
            <li
              key={item.id}
              title={t(item.description as never)}
              className='flex min-w-0 items-center gap-3 px-2.5 py-2'>
              <AchievementPhysicalCard
                Icon={item.Icon}
                rarity={item.rarity}
                isMobileView={isMobileView}
                hoverScale={1.08}
                className='h-10 w-10 shrink-0 rounded-lg'
              />
              <div className='min-w-0'>
                <p className='truncate text-sm font-semibold text-zinc-100'>
                  {t(item.name as never)}
                </p>
                <p className='truncate text-xs text-zinc-400'>
                  {rarityLine(item)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
