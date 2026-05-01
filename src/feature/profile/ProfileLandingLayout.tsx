import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "assets/components/ui/tooltip";
import { ActivityLogView } from "components/ActivityLog/ActivityLog";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { DashboardSection } from "components/Layout";
// ActiveChallengeWidget removed
import { HeroBanner } from "components/UI/HeroBanner";
import { IMG_RANKS_NUMBER } from "constants/gameSettings";
import { GUITAR_DEFINITIONS } from "feature/arsenal/data/guitarDefinitions";
import { DailyQuestWidget } from "feature/dashboard/components/DailyQuestWidget";
import { LevelProgressCircle } from "feature/profile/components/LevelProgressCircle";
import { PracticeStatsWidget } from "feature/profile/components/PracticeStatsWidget";
import { getTrendData } from "feature/profile/utils/getTrendData";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import type { Song } from "feature/songs/types/songs.type";
import { calculateSkillPower } from "feature/songs/utils/difficulty.utils";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { ArrowRight, Gem } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import type { StatisticsDataInterface } from "types/api.types";
import type { ProfileInterface } from "types/ProfileInterface";
import { convertMsToHM } from "utils/converter";
import { getPointsToLvlUp } from "utils/gameLogic";

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
  const [songs, setSongs] = useState<{ wantToLearn: Song[]; learning: Song[]; learned: Song[] }>();

  useEffect(() => {
    getUserSongs(userAuth).then((s) => setSongs(s));
  }, [userAuth]);

  const todayStr = new Date().toDateString();
  const lastReportDate = userStats?.lastReportDate ? new Date(userStats.lastReportDate).toDateString() : null;
  const isTodayCompleted = lastReportDate === todayStr || datasWithReports.some(d => d.date.toDateString() === todayStr && d.report);

  const totalTimeValue = userStats ? convertMsToHM(
    userStats.time.technique + userStats.time.theory + userStats.time.creativity + userStats.time.hearing
  ) : "0:00";
  const timeTrendData = getTrendData(datasWithReports, "time");



  const skillPower = songs?.learned ? calculateSkillPower(songs.learned) : 0;
  const songTier = getSongTier(skillPower > 0 ? skillPower : '?');

  const imgPath = userInfo?.selectedGuitar ?? (userStats?.lvl >= IMG_RANKS_NUMBER ? IMG_RANKS_NUMBER : userStats?.lvl);
  const isSpecialGuitar = typeof imgPath === "string" && imgPath.includes("special/");
  const specialGuitarDef = isSpecialGuitar ? GUITAR_DEFINITIONS.find((g) => g.imageId === imgPath) : null;
  const RARITY_COLORS: Record<string, string> = {
    Common: "#9ca3af",
    Uncommon: "#4ade80",
    Rare: "#60a5fa",
    Epic: "#c084fc",
    Legendary: "#fb923c",
    Mythic: "#f43f5e",
  };
  const glowColor = specialGuitarDef ? (RARITY_COLORS[specialGuitarDef.rarity] ?? "#0891b2") : "#0891b2";

  return (
    <div className="bg-second-600 rounded-xl flex flex-col shadow-sm border-none lg:mt-16">
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
                src={`/static/images/rank/${imgPath}.png`}
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
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative flex flex-col items-center gap-1.5 cursor-default">
                    <span className="text-[10px] font-semibold tracking-widest text-zinc-400">Song tier</span>
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 text-2xl font-black shadow-lg"
                      style={{ color: songTier.color, backgroundColor: 'rgba(10,10,10,0.9)', borderColor: `${songTier.color}40` }}
                    >
                      {songTier.tier}
                    </div>
                    <span className="text-[11px] font-medium" style={{ color: songTier.color }}>{songTier.label}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[220px] text-center text-zinc-800 leading-relaxed">
                  Your skill tier based on the difficulty of songs you've mastered. Ranges from D (beginner) to S (master).
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

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
                Start practice
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </button>
            </div>
            {(userStats?.fame ?? 0) >= 30 && (
              <button
                onClick={() => router.push("/arsenal")}
                className="group/fame flex items-center gap-2 w-fit rounded-[8px] bg-zinc-800/80 backdrop-blur-md border border-orange-500/30 hover:border-orange-400/60 hover:bg-zinc-700/80 text-white px-4 py-2 text-sm font-semibold transition-all duration-300 active:scale-95"
              >
                <Gem className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                {/* Mobile: compact */}
                <span className="md:hidden text-orange-400 font-bold">{(userStats.fame ?? 0).toLocaleString()}</span>
                <span className="md:hidden text-zinc-300 text-xs">pts</span>
                <span className="md:hidden text-zinc-500 text-xs">·</span>
                <span className="md:hidden text-orange-400 group-hover/fame:text-orange-300 transition-colors duration-200">Arsenal</span>
                {/* Desktop: full */}
                <span className="hidden md:inline text-zinc-300 group-hover/fame:text-white transition-colors duration-200">
                  {(userStats.fame ?? 0).toLocaleString()} Fame Points
                </span>
                <span className="hidden md:inline text-zinc-500 text-xs">·</span>
                <span className="hidden md:inline text-orange-400 group-hover/fame:text-orange-300 transition-colors duration-200">Spend in Arsenal</span>
                <ArrowRight className="h-3.5 w-3.5 text-orange-400 transition-transform duration-300 group-hover/fame:translate-x-0.5 shrink-0" />
              </button>
            )}
          </div>
        }
      />
      
      <div className="md:mt-6 space-y-6 p-4 md:p-6">
        <div className="relative z-10">
          <div className="mt-6">
            <DashboardSection compact>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
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
          </div>

          <div className="mt-8">
            <ActivityLogView
              year={year}
              setYear={setYear}
              datasWithReports={datasWithReports}
              isLoading={isLoading}
            />
          </div>

          {featSlot && featSlot}
        </div>
      </div>
    </div>
  );
};

export default ProfileLandingLayout;
