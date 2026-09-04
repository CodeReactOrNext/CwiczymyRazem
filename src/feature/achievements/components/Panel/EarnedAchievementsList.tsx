import { rateFromStats } from "lib/achievements/achievementStats";
import { useMemo } from "react";

import { achievementsMap } from "../../data/achievementsData";
import { getGlobalUnlockRate } from "../../data/globalUnlockRate";
import { useAchievementStats } from "../../hooks/useAchievementStats";
import type { AchievementList } from "../../types";
import { AchievementCard } from "../Card/AchievementCard";

/**
 * The badges one account has earned, as one wall of cards.
 *
 * For a profile someone else is looking at, so it shows only what was earned:
 * what a stranger has not got is not the reader's business. Ungrouped, because
 * the rarity a section header used to name is already the colour of the card
 * under it — rarest first, so the hardest ones are what the page opens with.
 *
 * No `useAchievementContext` here, deliberately. That hook reads the *signed-in*
 * account, so on someone else's profile it would answer with the visitor's own
 * stash. An earned card needs no context, and passing none keeps that impossible
 * rather than merely unlikely.
 */
export const EarnedAchievementsList = ({
  userAchievements,
}: {
  userAchievements: AchievementList[];
}) => {
  const { data: stats } = useAchievementStats();

  const earned = useMemo(
    () =>
      userAchievements
        .map((id) => achievementsMap.get(id))
        .filter((data): data is NonNullable<typeof data> => Boolean(data))
        .map((data) => ({
          data,
          rate: rateFromStats(data.id, stats) ?? getGlobalUnlockRate(data.id, data.rarity),
        }))
        // Ties break on the id so the order is total and cannot wobble.
        .sort((a, b) => a.rate - b.rate || a.data.id.localeCompare(b.data.id)),
    [userAchievements, stats]
  );

  if (earned.length === 0) return null;

  return (
    <div className='flex flex-row flex-wrap gap-3 md:gap-4'>
      {earned.map(({ data }) => (
        <AchievementCard key={data.id} id={data.id} data={data} isUnlocked />
      ))}
    </div>
  );
};
