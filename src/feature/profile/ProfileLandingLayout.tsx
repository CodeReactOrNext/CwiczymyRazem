import { ActivityLogView } from "components/ActivityLog/ActivityLog";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { DashboardSection } from "components/Layout";
// ActiveChallengeWidget removed
import { HeroBanner } from "components/UI/HeroBanner";
import { IMG_RANKS_NUMBER } from "constants/gameSettings";
import { getRarityColor } from "feature/arsenal/components/RarityBadge";
import { getEquippedRarity } from "feature/arsenal/data/equippedGuitar";
import { GUITAR_DEFINITIONS } from "feature/arsenal/data/guitarDefinitions";
import { useEquippedGuitar } from "feature/arsenal/hooks/useUserArsenal";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { DailyQuestWidget } from "feature/dashboard/components/DailyQuestWidget";
import { SupportBanner } from "feature/dashboard/components/SupportBanner";
import { GettingStartedWidget } from "feature/onboarding/components/GettingStartedWidget/GettingStartedWidget";
import type { LastSessionInfo } from "feature/practice/utils/lastSession";
import { loadLastSession } from "feature/practice/utils/lastSession";
import { LevelProgressCircle } from "feature/profile/components/LevelProgressCircle";
import { PracticeStatsWidget } from "feature/profile/components/PracticeStatsWidget";
import { SongTierBadge } from "feature/profile/components/SongTierBadge";
import { getTrendData } from "feature/profile/utils/getTrendData";
import { useUserSongs } from "feature/songs/hooks/useUserSongs";
import { ArrowRight, History } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import type { StatisticsDataInterface } from "types/api.types";
import type { ProfileInterface } from "types/ProfileInterface";
import { convertMsToHM } from "utils/converter";

interface LandingLayoutProps {
  userStats: StatisticsDataInterface;
  featSlot: React.ReactNode;
  userAuth: string;
  userInfo?: Partial<ProfileInterface> | any | null;
}

const ProfileLandingLayout = ({
  userStats,
  userAuth,
  featSlot,
  userInfo,
}: LandingLayoutProps) => {
  const router = useRouter();
  const { datasWithReports, year, setYear, isLoading, reportList } = useActivityLog(userAuth);
  const {
    songs,
    isLoading: isSongsLoading,
    isError: isSongsError,
  } = useUserSongs(userAuth);
  const [lastSession, setLastSession] = useState<LastSessionInfo | null>(null);
  const { item: equippedGuitar } = useEquippedGuitar(userAuth);

  useEffect(() => {
    setLastSession(loadLastSession());
  }, []);

  const todayStr = new Date().toDateString();
  const lastReportDate = userStats?.lastReportDate ? new Date(userStats.lastReportDate).toDateString() : null;
  const isTodayCompleted = lastReportDate === todayStr || datasWithReports.some(d => d.date.toDateString() === todayStr && d.report);

  const totalTimeValue = userStats ? convertMsToHM(
    userStats.time.technique + userStats.time.theory + userStats.time.creativity + userStats.time.hearing
  ) : "0:00";
  const timeTrendData = getTrendData(datasWithReports, "time");

  const imgPath = userInfo?.selectedGuitar ?? (userStats?.lvl >= IMG_RANKS_NUMBER ? IMG_RANKS_NUMBER : userStats?.lvl);
  const isSpecialGuitar = typeof imgPath === "string" && imgPath.includes("special/");
  const specialGuitarDef = isSpecialGuitar ? GUITAR_DEFINITIONS.find((g) => g.imageId === imgPath) : null;
  // Lit by what the guitar is now: the workshop can promote it past its mint
  // rarity, and that promotion only exists on the owner's inventory item.
  const equippedRarity = getEquippedRarity(equippedGuitar, specialGuitarDef);
  // No special guitar equipped falls back to the brand cyan, not to a rarity.
  const glowColor = equippedRarity ? getRarityColor(equippedRarity) : "#0891b2";

  return (
    <div className="bg-second-600 rounded-xl flex flex-col shadow-sm border-none">
      <HeroBanner
        title={isTodayCompleted ? "Great job today!" : "Start today's practice"}
        className="w-full !rounded-none !shadow-none !flex-row !items-center !justify-between min-h-[160px] md:min-h-[200px] lg:min-h-[240px]"

        backgroundContent={
          isSpecialGuitar ? (
            <div className="absolute inset-0 z-0 overflow-hidden rounded-none md:rounded-xl">
              {/* Glow Blur on the left */}
              <div className='absolute left-[0%] md:left-[5%] top-[-10%] md:top-[-15%] blur-[80px] opacity-25 md:opacity-30 pointer-events-none' style={{ backgroundColor: glowColor, width: '350px', height: '350px', borderRadius: '50%' }} />

              {/* Guitar with CSS fade on the right side */}
              <img
                src={getRankBadgeSrc(imgPath, "large")}
                className="absolute top-[-15%] md:top-[-35%] left-[0%] md:left-[8%] max-w-none h-[300px] md:h-[480px] -rotate-[90deg] md:-rotate-[15deg] opacity-[0.75] pointer-events-none"
                style={{ 
                  filter: `drop-shadow(0 15px 40px rgba(0,0,0,0.9)) drop-shadow(0 0 20px ${glowColor}30)`,
                  WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 95%)',
                  maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 95%)'
                }}
                alt="Background Guitar"
              />
            </div>
          ) : null
        }
        rightContent={
          <div className="relative flex select-none items-center gap-4 pr-2">

            <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-3xl" />

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
            />

          </div>
        }
        leftContent={
          <div className="flex flex-col gap-3">
            <div className="flex flex-row flex-wrap gap-3 items-center">
              <button
                onClick={() => router.push("/timer")}
                className="group/btn rounded-[8px] bg-white text-zinc-950 px-5 py-2.5 text-sm font-semibold transition-all duration-300 flex items-center gap-2 active:scale-95"
              >
                Practice
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </button>
            </div>
            {lastSession && (
              <button
                onClick={() => router.push(lastSession.href)}
                className="group/last flex w-fit max-w-full items-center gap-2 rounded-[8px] bg-zinc-900 hover:bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-all duration-300 active:scale-95"
              >
                <History className="h-4 w-4 shrink-0 text-zinc-500" />
                <span className="text-zinc-500">Last session:</span>
                <span className="truncate font-semibold text-zinc-200">{lastSession.title}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform duration-300 group-hover/last:translate-x-0.5" />
              </button>
            )}
          </div>
        }
      />

      <div className="md:mt-6 space-y-6 p-4 md:p-6">
        <div className="relative z-10">
            <DashboardSection compact>
              <div className="mb-6">
                <GettingStartedWidget />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <DailyQuestWidget />
                <PracticeStatsWidget
                  userStats={userStats}
                  totalTimeValue={totalTimeValue}
                  trendData={timeTrendData}
                  reportList={reportList}
                  className="h-full"
                />
              </div>
            </DashboardSection>

            <ActivityLogView
              year={year}
              setYear={setYear}
              datasWithReports={datasWithReports}
              isLoading={isLoading}
            />

          <div className="mt-6 mb-6">
            <SupportBanner />
          </div>

          {featSlot && featSlot}
        </div>
      </div>
    </div>
  );
};

export default ProfileLandingLayout;
