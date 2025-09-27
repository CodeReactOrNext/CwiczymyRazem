import type { DateWithReport } from "components/ActivityLog/activityLog.types";
import { StatsCard } from "components/Cards";
import SeasonalAchievements from "feature/profile/components/SeasonalAchievements/SeasonalAchievements";
import SkillsRadarChart from "feature/profile/components/SkillsRadarChart/SkillsRadarChart";
import {
  StatsField,
  type StatsFieldProps,
} from "feature/profile/components/StatsField";
import type { Song } from "feature/songs/types/songs.type";
import { useTranslation } from "react-i18next";
import type { StatisticsDataInterface } from "types/api.types";
import { calculatePercent, convertMsToHM } from "utils/converter";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { getTrendData } from "../utils/getTrendData";
import { Card } from "assets/components/ui/card";

interface StatsSectionProps {
  statsField: StatsFieldProps[];
  statistics: StatisticsDataInterface;
  datasWithReports: DateWithReport[];
  userAuth: string;
  userSongs:
    | {
        wantToLearn: Song[];
        learning: Song[];
        learned: Song[];
      }
    | undefined;
}

export const StatsSection = ({
  statsField,
  statistics,
  datasWithReports,
  userSongs,
  userAuth,
}: StatsSectionProps) => {
  const { t } = useTranslation("profile");
  const { time } = statistics;
  const [isSeasonalAchievementsExpanded, setIsSeasonalAchievementsExpanded] =
    useState(false);
  const totalTime =
    time.technique + time.theory + time.hearing + time.creativity;

  const statsWithKeys = statsField.map((stat) => {
    if (stat.id === "total-time") {
      return {
        ...stat,
        key: "time",
      };
    }

    if (stat.id === "points") {
      return {
        ...stat,
        key: "points",
      };
    }

    return stat;
  });

  const sortedStats = statsWithKeys.sort((a, b) => {
    if (a.key && !b.key) return -1;
    if (!a.key && b.key) return 1;

    if (a.key === "time" && b.key === "points") return -1;
    if (a.key === "points" && b.key === "time") return 1;

    return 0;
  });

  const statsWithTrends = sortedStats.map((stat) => {
    if (!stat.key) return stat;

    const trendData = getTrendData(
      datasWithReports,
      stat.key as "points" | "time"
    );

    return {
      ...stat,
      trendData,
    };
  });

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='space-y-6 lg:col-span-2'>
          <div className='relative mb-6'>
            <h3 className='text-xl font-semibold text-white'>Statystyki</h3>
            <p className='text-xs text-zinc-400'>
              Najważniejsze liczby dotyczące twojego postępu
            </p>
          </div>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            {statsWithTrends
              .filter(
                (stat) => stat.id === "total-time" || stat.id === "points"
              )
              .map(({ id, Icon, description, value, trendData }) => (
                <StatsField
                  key={id}
                  Icon={Icon}
                  description={description}
                  value={value}
                  trendData={trendData}
                />
              ))}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            {statsWithTrends
              .filter(
                (stat) =>
                  stat.id === "session-count" || stat.id === "habits-count"
              )
              .map(({ id, Icon, description, value }) => (
                <StatsCard
                  key={id}
                  title={description}
                  value={value}
                  icon={Icon ? <Icon className='h-4 w-4' /> : undefined}
                  compact
                />
              ))}
          </div>

          {userSongs && (
            <Card className='p- group  relative  transition-all duration-300 '>
              <div className='relative'>
                {(() => {
                  const totalSongs =
                    userSongs.wantToLearn.length +
                    userSongs.learning.length +
                    userSongs.learned.length;
                  const learnedPercentage = totalSongs
                    ? (userSongs.learned.length / totalSongs) * 100
                    : 0;
                  const learningPercentage = totalSongs
                    ? (userSongs.learning.length / totalSongs) * 100
                    : 0;

                  if (totalSongs === 0) {
                    return (
                      <div className='rounded-lg  bg-zinc-800/30 p-6 text-center'>
                        <div className='mb-3'>
                          <svg
                            className='mx-auto h-12 w-12 text-zinc-400'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={1.5}
                              d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
                            />
                          </svg>
                        </div>
                        <h5 className='mb-2 font-semibold text-white'>
                          Brak piosenek
                        </h5>
                        <p className='text-sm text-zinc-400'>
                          Dodaj swoje pierwsze piosenki do biblioteki
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className='space-y-5'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h5 className='font-semibold text-white'>
                            Ogólny postęp
                          </h5>
                          <p className='text-xs text-zinc-400'>
                            {totalSongs} piosenek w bibliotece
                          </p>
                        </div>
                        <div className='text-right'>
                          <div className='text-2xl font-semibold text-white'>
                            {learnedPercentage.toFixed(0)}%
                          </div>
                          <div className='text-xs text-zinc-400'>ukończone</div>
                        </div>
                      </div>

                      <div className='relative mb-3 h-2 w-full overflow-hidden rounded-full bg-zinc-700/50'>
                        <div
                          className='absolute left-0 top-0 h-full bg-white transition-all duration-700'
                          style={{ width: `${learnedPercentage}%` }}></div>
                        <div
                          className='absolute top-0 h-full bg-white/40 transition-all duration-700'
                          style={{
                            left: `${learnedPercentage}%`,
                            width: `${learningPercentage}%`,
                          }}></div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </Card>
          )}

          {/* Skills Chart - Mobile */}
          <div className='lg:hidden'>
            <div className='relative mb-6'>
              <h3 className='text-xl font-semibold text-white'>Umiejętności</h3>
              <p className='text-xs text-zinc-400'>
                Rozkład czasu ćwiczeń według kategorii
              </p>
            </div>
            <SkillsRadarChart statistics={statistics} />
          </div>
        </div>

        {/* Right Column - Skills */}
        <div className='space-y-6'>
          <div className='hidden lg:block'>
            <div className='relative mb-6'>
              <h3 className='text-xl font-semibold text-white'>Umiejętności</h3>
              <p className='text-xs text-zinc-400'>
                Rozkład czasu ćwiczeń według kategorii
              </p>
            </div>
            <SkillsRadarChart statistics={statistics} />
          </div>
        </div>
      </div>

      {/* Seasonal Achievements - Collapsible */}
      <div className='space-y-4'>
        <button
          onClick={() =>
            setIsSeasonalAchievementsExpanded(!isSeasonalAchievementsExpanded)
          }
          className='flex w-full items-center justify-between rounded-lg bg-white/5 p-4 backdrop-blur-sm transition-all duration-200 hover:bg-white/10'
          aria-expanded={isSeasonalAchievementsExpanded}>
          <div className='text-left'>
            <h3 className='text-lg font-semibold text-white'>
              Osiągnięcia Sezonowe
            </h3>
            <p className='text-sm text-zinc-400'>
              Specjalne nagrody i trofea sezonowe
            </p>
          </div>
          <div className='text-white transition-transform duration-200'>
            {isSeasonalAchievementsExpanded ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </div>
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            isSeasonalAchievementsExpanded
              ? "max-h-[1000px] opacity-100"
              : "max-h-0 opacity-0"
          }`}>
          <SeasonalAchievements userId={userAuth} />
        </div>
      </div>
    </div>
  );
};
