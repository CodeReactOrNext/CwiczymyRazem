import { Button } from "assets/components/ui/button";
import { Skeleton } from "assets/components/ui/skeleton";
import { TableSkeleton } from "assets/components/ui/table-skeleton";
import { cn } from "assets/lib/utils";
import { EmptyState } from "components/EmptyState/EmptyState";
import { PAGE_CONTENT } from "components/PageShell/PageShell";
import { PageTabs } from "components/PageTabs/PageTabs";
import { SegmentedControl } from "components/SegmentedControl/SegmentedControl";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { LEADERBOARD_TABS } from "constants/navTabs";
import {
  LEADBOARD_ROW_GRID,
  LeadboardRow,
} from "feature/leadboard/components/LeadboardRow";
import { Pagination } from "feature/leadboard/components/Pagination";
import type { LeaderboardViewType } from "feature/leadboard/hooks/useLeaderboard";
import type { LeaderboardNeighbors } from "feature/leadboard/services/getLeaderboardNeighbors";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { ArrowDown, CloudOff } from "lucide-react";
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

  const renderRow = (
    user: FirebaseUserDataInterface,
    place: number,
    order: number,
  ) => (
    <LeadboardRow
      key={user.profileId}
      order={order}
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

  // One line of labels for every card below it, on the same column tracks.
  const listHeader = (
    <div
      className={cn(
        "hidden items-center gap-x-5 px-5 pb-2 text-xs font-medium text-zinc-500 sm:grid",
        LEADBOARD_ROW_GRID[isGearView ? "gear" : "default"],
      )}>
      <span className='col-start-3 truncate pl-2'>{t("player")}</span>
      {isGearView ? (
        <>
          <span className='truncate text-right'>{t("rig_level")}</span>
          <span className='truncate text-right'>{t("guitars")}</span>
          <span className='truncate text-right'>{t("effects")}</span>
          <span className='hidden truncate xl:block'>{t("rig.title")}</span>
        </>
      ) : (
        <>
          <span className='truncate text-right'>{t("points")}</span>
          <span className='truncate text-right'>{t("exercise_time")}</span>
        </>
      )}
    </div>
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
        <span className='font-teko text-5xl font-semibold tabular-nums leading-[0.8] text-zinc-50 md:text-6xl'>
          #{userRank}
        </span>
        {totalUsers > 0 && (
          <span className='text-sm tabular-nums text-zinc-400'>
            {t("rank.out_of", { total: totalUsers.toLocaleString(intlLocale) })}
          </span>
        )}
      </div>
      {nextRival && (
        <p className='mt-3 hidden text-sm text-zinc-300 md:block'>
          <span className='font-semibold tabular-nums text-cyan-300'>
            {nextRival.gap.toLocaleString(intlLocale)}
          </span>{" "}
          {t("rank.to_pass", { unit: gapUnit(nextRival.gap), name: nextRival.displayName, place: nextRival.place })}
        </p>
      )}
      {canShowAround && (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={jumpToMyRank}
          className='mt-3'>
          <ArrowDown />
          {t("rank.jump")}
        </Button>
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
      }
    : {
        eyebrow: t("hero.all_time_eyebrow"),
        title: t("hero.title"),
      };

  return (
    <div className='flex flex-col'>
      <HeroBanner
        {...hero}
        backgroundContent={<HeroPattern />}
        compact
        // The rewards belong to the season, so they sit under its name — one
        // line, the full ladder behind a key, so the banner stays short.
        leftContent={isSeasonalView ? <SeasonRewards /> : undefined}
        leftContentClassName='mt-3'
        rightContent={rankContent}
      />

      <div className={PAGE_CONTENT}>
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
              <SegmentedControl<ListScope>
                label={`${t("scope.top")} / ${t("scope.around")}`}
                selected={[activeScope]}
                onSelect={setScope}
                className='ml-auto'
                options={[
                  { value: "top", label: t("scope.top") },
                  { value: "around", label: t("scope.around") },
                ]}
              />
            )}
          </div>
        )}

        {/* scroll-mt clears the sticky top bar when jumping here. */}
        <div ref={listRef} className='scroll-mt-24 pb-20'>
          {activeScope === "around" ? (
            isNeighborsLoading ? (
              <ul className='flex flex-col gap-1.5 sm:gap-2'>
                <TableSkeleton rows={5} />
              </ul>
            ) : neighbors ? (
              <>
                {listHeader}
                <ul className='flex flex-col gap-1.5 sm:gap-2'>
                  {neighbors.rows.map(({ user, place }, index) =>
                    renderRow(user, place, index),
                  )}
                </ul>
              </>
            ) : (
              <EmptyState
                size='compact'
                icon={<CloudOff />}
                title={t("scope.around_error")}
              />
            )
          ) : isLoading ? (
            <>
              <ul className='flex flex-col gap-1.5 sm:gap-2'>
                <TableSkeleton rows={itemsPerPage} />
              </ul>
              <div className='mt-8 flex justify-center'>
                <Skeleton className='mb-4 h-9 w-64 rounded-lg' />
              </div>
            </>
          ) : !usersData.length ? (
            <EmptyState
              mood='lookAround'
              title={
                isSeasonalView ? t("no_seasonal_data") : t("empty_users_title")
              }
              description={
                isSeasonalView
                  ? t("no_seasonal_data_found")
                  : isGearView
                    ? t("no_gear_data_found")
                    : t("no_users_found")
              }
            />
          ) : (
            <>
              {listHeader}
              <ul className='flex flex-col gap-1.5 sm:gap-2'>
                {usersData.map((user, index) =>
                  renderRow(
                    user,
                    (currentPage - 1) * itemsPerPage + index + 1,
                    index,
                  ),
                )}
              </ul>

              {/* Clean Pagination */}
              <div className='mt-8 flex justify-center'>
                <div className='rounded-lg bg-zinc-800/40 p-4'>
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
