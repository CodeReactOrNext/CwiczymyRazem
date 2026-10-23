import { Skeleton } from "assets/components/ui/skeleton";
import { TableSkeleton } from "assets/components/ui/table-skeleton";
import { Tabs, TabsList, TabsTrigger } from "assets/components/ui/tabs";
import { PageTabs } from "components/PageTabs/PageTabs";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { LEADERBOARD_TABS } from "constants/navTabs";
import { LeadboardRow } from "feature/leadboard/components/LeadboardRow";
import { Pagination } from "feature/leadboard/components/Pagination";
import type { LeaderboardViewType } from "feature/leadboard/hooks/useLeaderboard";
import type { LeaderboardNeighbors } from "feature/leadboard/services/getLeaderboardNeighbors";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { ArrowDown } from "lucide-react";
import { useRef, useState } from "react";
import type { SeasonDataInterface } from "types/api.types";
import type { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";

import { SeasonRewards } from "./SeasonRewards";
import SeasonSelect from "./SeasonSelect";

export type SortByType = "points" | "sessionCount";

/** The leaders, or the few places around the player. */
type ListScope = "top" | "around";

interface LeaderboardProps {
  usersData: FirebaseUserDataInterface[];
  currentUserId: string | null;
  isLoading: boolean;
  totalUsers: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  view: LeaderboardViewType;
  seasons: SeasonDataInterface[];
  selectedSeason: string;
  setSelectedSeason: (value: string) => void;
  lastAccessiblePage: number;
  userRank?: number | null;
  isRankLoading?: boolean;
  neighbors?: LeaderboardNeighbors | null;
  isNeighborsLoading?: boolean;
}

export const LeadboardLayout = ({
  usersData,
  currentUserId,
  isLoading,
  totalUsers,
  currentPage,
  itemsPerPage,
  onPageChange,
  view,
  seasons,
  selectedSeason,
  setSelectedSeason,
  lastAccessiblePage,
  userRank,
  isRankLoading,
  neighbors,
  isNeighborsLoading,
}: LeaderboardProps) => {
  const { t } = useTranslation("leadboard");
  const intlLocale = useIntlLocale();
  const [scope, setScope] = useState<ListScope>("top");
  const listRef = useRef<HTMLDivElement>(null);
  const totalPages = Math.ceil(totalUsers / itemsPerPage);
  const isSeasonalView = view === "seasonal";
  const isGearView = view === "gear";
  const activeTabHref = isSeasonalView
    ? "/seasons"
    : isGearView
    ? "/leaderboard/gear"
    : "/leaderboard";

  const currentSeason = seasons.find(s => s.seasonId === selectedSeason) as SeasonDataInterface | undefined;
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(intlLocale);
  };

  const nextRival = neighbors?.nextRival ?? null;
  const gapUnit = (gap: number) =>
    isGearView
      ? gap === 1 ? t("rank.level") : t("rank.levels")
      : gap === 1 ? t("rank.point") : t("rank.points");
  // Worth offering only when the player is not already in the top page.
  const canShowAround = !!userRank && userRank > itemsPerPage && !!currentUserId;
  const activeScope: ListScope = canShowAround ? scope : "top";

  const jumpToMyRank = () => {
    setScope("around");
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderRow = (user: FirebaseUserDataInterface, place: number) => (
    <LeadboardRow
      key={user.profileId}
      profileId={user.profileId}
      place={place}
      nick={user.displayName}
      userAvatar={user.avatar}
      statistics={user.statistics}
      currentUserId={currentUserId}
      variant={isGearView ? "gear" : "default"}
      rigLevel={user.rigLevel ?? 0}
      guitarsOwned={user.arsenal?.inventory?.length ?? 0}
      effectsOwned={user.arsenal?.effectInventory?.length ?? 0}
      arsenal={user.arsenal}
      guildBadge={user.guildBadge}
    />
  );

  // Same shape as the duel rating in the duels hero: one big Teko number, the
  // context it needs on the line beside it, what to do next underneath.
  const rankContent = isRankLoading ? (
    <div className='flex flex-col items-start gap-2 md:items-end'>
      <Skeleton className='h-4 w-24 rounded' />
      <Skeleton className='h-14 w-36 rounded-lg' />
    </div>
  ) : userRank ? (
    <div className='flex flex-col items-start md:items-end md:text-right'>
      <span className='text-xs font-semibold text-zinc-400'>
        {t("rank.your_position")}
      </span>
      <div className='mt-1 flex items-baseline gap-3'>
        <span className='font-teko text-7xl font-semibold tabular-nums leading-[0.8] text-zinc-50'>
          #{userRank}
        </span>
        {totalUsers > 0 && (
          <span className='text-sm tabular-nums text-zinc-400'>
            {t("rank.out_of", { total: totalUsers.toLocaleString(intlLocale) })}
          </span>
        )}
      </div>
      {nextRival && (
        <p className='mt-3 text-sm text-zinc-300'>
          <span className='font-semibold tabular-nums text-cyan-300'>
            {nextRival.gap.toLocaleString(intlLocale)}
          </span>{" "}
          {t("rank.to_pass", { unit: gapUnit(nextRival.gap), name: nextRival.displayName, place: nextRival.place })}
        </p>
      )}
      {canShowAround && (
        <button
          type='button'
          onClick={jumpToMyRank}
          className='mt-4 flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60'>
          <ArrowDown className='h-3.5 w-3.5' />
          {t("rank.jump")}
        </button>
      )}
    </div>
  ) : null;

  const hero = isSeasonalView
    ? {
        eyebrow: t("hero.seasonal_eyebrow"),
        title: currentSeason?.name ?? t("hero.season"),
        subtitle: currentSeason
          ? `${formatDate(currentSeason.startDate)} – ${formatDate(currentSeason.endDate)}`
          : t("hero.season_subtitle"),
      }
    : isGearView
    ? {
        eyebrow: t("hero.rig_eyebrow"),
        title: t("gear_title"),
        subtitle: t("gear_subtitle"),
      }
    : {
        eyebrow: t("hero.all_time_eyebrow"),
        title: t("hero.title"),
        subtitle: t("hero.subtitle"),
      };

  return (
    <div className='min-h-screen flex flex-col'>
      <HeroBanner
        {...hero}
        className='w-full !rounded-none !shadow-none'
        backgroundContent={<HeroPattern />}
        // The rewards belong to the season, so they sit under its name rather
        // than queue up under the player's rank.
        leftContent={isSeasonalView ? <SeasonRewards /> : undefined}
        leftContentClassName=''
        rightContent={rankContent}
      />

      <div className='mt-8 mx-auto max-w-7xl px-4 w-full'>
        <PageTabs
          tabs={LEADERBOARD_TABS}
          activeHref={activeTabHref}
          ariaLabel={t("hero.sections")}
          className='mb-8'
        />

        {(isSeasonalView || canShowAround) && (
          <div className='mb-8 flex flex-wrap items-center gap-6'>
            {isSeasonalView && (
              <SeasonSelect
                seasons={seasons}
                selectedSeason={selectedSeason}
                setSelectedSeason={setSelectedSeason}
                isLoading={isLoading}
              />
            )}
            {canShowAround && (
              <Tabs
                value={activeScope}
                onValueChange={(value) => setScope(value as ListScope)}
                className='ml-auto'>
                <TabsList className='h-10 bg-zinc-900/60 text-zinc-400'>
                  <TabsTrigger
                    value='top'
                    className='px-4 data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-none'>
                    {t("scope.top")}
                  </TabsTrigger>
                  <TabsTrigger
                    value='around'
                    className='px-4 data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-none'>
                    {t("scope.around")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
        )}

        {/* scroll-mt clears the sticky top bar when jumping here. */}
        <div ref={listRef} className='scroll-mt-24 pb-20'>
          {activeScope === "around" ? (
            isNeighborsLoading ? (
              <ul className='flex flex-col gap-6'>
                <TableSkeleton rows={5} />
              </ul>
            ) : neighbors ? (
              <ul className='flex flex-col gap-6'>
                {neighbors.rows.map(({ user, place }) =>
                  renderRow(user, place),
                )}
              </ul>
            ) : (
              <p className='py-16 text-center text-sm text-zinc-500'>
                {t("scope.around_error")}
              </p>
            )
          ) : isLoading ? (
            <>
              <ul className='flex flex-col gap-6'>
                <TableSkeleton rows={itemsPerPage} />
              </ul>
              <div className='mt-8 flex justify-center'>
                 <div className='h-16 w-64 animate-pulse rounded-2xl bg-zinc-900/30 backdrop-blur-sm' />
              </div>
            </>
          ) : !usersData.length ? (
            <div className='flex h-[50vh] items-center justify-center'>
              <div className='text-center'>
                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50'>
                  <span className='text-2xl'>📊</span>
                </div>
                <h3 className='mb-2 text-xl font-semibold text-zinc-300'>
                  {isSeasonalView ? t("no_seasonal_data") : t("empty_users_title")}
                </h3>
                <p className='text-sm text-zinc-500'>
                  {isSeasonalView
                    ? t("no_seasonal_data_found")
                    : isGearView
                    ? t("no_gear_data_found")
                    : t("no_users_found")}
                </p>
              </div>
            </div>
          ) : (
            <>
              <ul className='flex flex-col gap-6'>
                {usersData.map((user, index) =>
                  renderRow(user, (currentPage - 1) * itemsPerPage + index + 1),
                )}
              </ul>

              {/* Clean Pagination */}
              <div className='mt-8 flex justify-center'>
                <div className='rounded-2xl bg-zinc-900/30 p-4 backdrop-blur-sm'>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                    lastAccessiblePage={lastAccessiblePage}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
