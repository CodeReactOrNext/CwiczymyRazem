import { cn } from "assets/lib/utils";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { HeroBanner } from "components/UI/HeroBanner";
import { IMG_RANKS_NUMBER } from "constants/gameSettings";
import { getRarityColor } from "feature/arsenal/components/RarityBadge";
import { getEquippedRarity } from "feature/arsenal/data/equippedGuitar";
import { GUITAR_DEFINITIONS } from "feature/arsenal/data/guitarDefinitions";
import { useEquippedGuitar } from "feature/arsenal/hooks/useUserArsenal";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { DashboardWidgets } from "feature/dashboard/components/DashboardWidgets";
import type { DashboardDataContextValue } from "feature/dashboard/context/DashboardContext";
import { DashboardDataProvider } from "feature/dashboard/context/DashboardContext";
import { useGettingStartedProgress } from "feature/onboarding/hooks/useGettingStartedProgress";
import type { LastSessionInfo } from "feature/practice/utils/lastSession";
import { loadLastSession } from "feature/practice/utils/lastSession";
import { LevelProgressCircle } from "feature/profile/components/LevelProgressCircle";
import { SongTierBadge } from "feature/profile/components/SongTierBadge";
import { getTrendData } from "feature/profile/utils/getTrendData";
import { useUserSongs } from "feature/songs/hooks/useUserSongs";
import { useTranslation } from "hooks/useTranslation";
import { ArrowRight, History } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import type { StatisticsDataInterface } from "types/api.types";
import type { ProfileInterface } from "types/ProfileInterface";
import { convertMsToHM } from "utils/converter";

interface LandingLayoutProps {
  userStats: StatisticsDataInterface;
  /** The community feed, pinned to the bottom of Home; the default one is used when absent. */
  featSlot?: React.ReactNode;
  userAuth: string;
  userInfo?: Partial<ProfileInterface> | any | null;
}

const ProfileLandingLayout = ({
  userStats,
  userAuth,
  featSlot,
  userInfo,
}: LandingLayoutProps) => {
  const { t } = useTranslation("profile");
  const router = useRouter();
  const { datasWithReports, year, setYear, isLoading, reportList } =
    useActivityLog(userAuth);
  const {
    songs,
    isLoading: isSongsLoading,
    isError: isSongsError,
  } = useUserSongs(userAuth);
  const [lastSession, setLastSession] = useState<LastSessionInfo | null>(null);
  const { item: equippedGuitar } = useEquippedGuitar(userAuth);
  const { progress: gettingStarted, isLoading: isGettingStartedLoading } =
    useGettingStartedProgress(
      userAuth,
      userStats?.sessionCount ?? 0,
      reportList,
    );
  const showHero = !isGettingStartedLoading && !gettingStarted?.isVisible;

  useEffect(() => {
    setLastSession(loadLastSession());
  }, []);

  const todayStr = new Date().toDateString();
  const lastReportDate = userStats?.lastReportDate
    ? new Date(userStats.lastReportDate).toDateString()
    : null;
  const isTodayCompleted =
    lastReportDate === todayStr ||
    datasWithReports.some(
      (d) => d.date.toDateString() === todayStr && d.report,
    );

  const totalTimeValue = userStats
    ? convertMsToHM(
        userStats.time.technique +
          userStats.time.theory +
          userStats.time.creativity +
          userStats.time.hearing,
      )
    : "0 min";
  const timeTrendData = getTrendData(datasWithReports, "time");

  // Everything the cards under the hero read from — handed down once so the
  // heatmap and the streak share one load of the activity log.
  const dashboardData = useMemo<DashboardDataContextValue>(
    () => ({
      userAuth,
      userStats,
      activity: { year, setYear, datasWithReports, isLoading, reportList },
      totalTimeValue,
      timeTrendData,
      feedSlot: featSlot,
    }),
    [
      userAuth,
      userStats,
      year,
      setYear,
      datasWithReports,
      isLoading,
      reportList,
      totalTimeValue,
      timeTrendData,
      featSlot,
    ],
  );

  const imgPath =
    userInfo?.selectedGuitar ??
    (userStats?.lvl >= IMG_RANKS_NUMBER ? IMG_RANKS_NUMBER : userStats?.lvl);
  const isSpecialGuitar =
    typeof imgPath === "string" && imgPath.includes("special/");
  const specialGuitarDef = isSpecialGuitar
    ? GUITAR_DEFINITIONS.find((g) => g.imageId === imgPath)
    : null;
  // Lit by what the guitar is now: the workshop can promote it past its mint
  // rarity, and that promotion only exists on the owner's inventory item.
  const equippedRarity = getEquippedRarity(equippedGuitar, specialGuitarDef);
  // No special guitar equipped falls back to the brand cyan, not to a rarity.
  const glowColor = equippedRarity ? getRarityColor(equippedRarity) : "#0891b2";

  return (
    <div className='flex flex-col rounded-xl border-none bg-second-600 shadow-sm'>
      {/* A new player's first job is the Getting Started card — the hero
          (practice button, level, song tier) waits until it is done. */}
      {showHero && (
        <HeroBanner
          title={
            isTodayCompleted ? t("landing.great_job") : t("landing.start_today")
          }
          // The tall banner is there to frame a special guitar; without one it
          // would only push the dashboard down, so it shrinks to its content.
          compact={!isSpecialGuitar}
          leftContentClassName={isSpecialGuitar ? undefined : "mt-0"}
          className={cn(
            "w-full !flex-row !items-center !justify-between !rounded-none !shadow-none",
            isSpecialGuitar &&
              "min-h-[160px] md:min-h-[200px] lg:min-h-[240px]",
          )}
          backgroundContent={
            isSpecialGuitar ? (
              <div className='absolute inset-0 z-0 overflow-hidden rounded-none md:rounded-xl'>
                {/* Glow Blur on the left */}
                <div
                  className='pointer-events-none absolute left-[0%] top-[-10%] opacity-25 blur-[80px] md:left-[5%] md:top-[-15%] md:opacity-30'
                  style={{
                    backgroundColor: glowColor,
                    width: "350px",
                    height: "350px",
                    borderRadius: "50%",
                  }}
                />

                {/* Guitar with CSS fade on the right side */}
                <img
                  src={getRankBadgeSrc(imgPath, "large")}
                  className='pointer-events-none absolute left-[0%] top-[-15%] h-[300px] max-w-none -rotate-[90deg] opacity-[0.75] md:left-[8%] md:top-[-35%] md:h-[480px] md:-rotate-[15deg]'
                  style={{
                    filter: `drop-shadow(0 15px 40px rgba(0,0,0,0.9)) drop-shadow(0 0 20px ${glowColor}30)`,
                    WebkitMaskImage:
                      "linear-gradient(to right, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 95%)",
                    maskImage:
                      "linear-gradient(to right, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 95%)",
                  }}
                  alt='Background Guitar'
                />
              </div>
            ) : null
          }
          rightContent={
            <div
              className={cn(
                "relative flex select-none flex-col gap-2 rounded-xl bg-zinc-900/50",
                isSpecialGuitar ? "p-3 md:p-4" : "p-3",
              )}>
              <span className='hidden text-xs font-semibold text-zinc-400 md:block'>
                {t("landing.your_progress", "Your progress")}
              </span>
              <div className='flex items-center gap-4'>
                {/* Song tier badge */}
                <SongTierBadge
                  learnedSongs={songs?.learned}
                  isLoading={isSongsLoading}
                  isError={isSongsError}
                  isOwnProfile
                  onClick={() => router.push("/songs?view=board")}
                />

                {/* Level ring */}
                <LevelProgressCircle
                  lvl={userStats?.lvl ?? 1}
                  points={userStats?.points ?? 0}
                  size={isSpecialGuitar ? undefined : 80}
                />
              </div>
            </div>
          }
          leftContent={
            <div className='flex flex-col gap-3'>
              <div className='flex flex-row flex-wrap items-center gap-3'>
                <button
                  onClick={() => router.push("/timer")}
                  className='group/btn flex min-h-11 items-center gap-2 rounded-[8px] bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all duration-300 active:scale-95'>
                  Practice
                  <ArrowRight className='h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1' />
                </button>
              </div>
              {lastSession && (
                <button
                  onClick={() => router.push(lastSession.href)}
                  className='group/last flex min-h-11 w-fit max-w-full items-center gap-3 rounded-[8px] bg-zinc-800/70 px-4 py-2.5 text-left transition-colors duration-300 hover:bg-zinc-700/70 active:scale-95'>
                  <History className='h-5 w-5 shrink-0 text-cyan-400' />
                  <span className='flex min-w-0 flex-col'>
                    <span className='text-xs text-zinc-400'>
                      {t("landing.last_session", "Last session")}
                    </span>
                    <span className='truncate text-sm font-semibold text-zinc-100'>
                      {t("landing.continue", "Continue")}: {lastSession.title}
                    </span>
                  </span>
                  <ArrowRight className='h-4 w-4 shrink-0 text-zinc-300 transition-transform duration-300 group-hover/last:translate-x-1' />
                </button>
              )}
            </div>
          }
        />
      )}

      <div className='relative z-10 p-4 md:mt-6 md:p-6'>
        <DashboardDataProvider value={dashboardData}>
          <DashboardWidgets />
        </DashboardDataProvider>
      </div>
    </div>
  );
};

export default ProfileLandingLayout;
