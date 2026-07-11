import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { ActivityLogView } from "components/ActivityLog/ActivityLog";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { DashboardSection } from "components/Layout";
// ActiveChallengeWidget removed
import { AnimatedNumber } from "components/UI/AnimatedNumber/AnimatedNumber";
import { HeroBanner } from "components/UI/HeroBanner";
import { IMG_RANKS_NUMBER } from "constants/gameSettings";
import { GUITAR_DEFINITIONS } from "feature/arsenal/data/guitarDefinitions";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { DailyQuestWidget } from "feature/dashboard/components/DailyQuestWidget";
import { SupportBanner } from "feature/dashboard/components/SupportBanner";
import type { LastSessionInfo } from "feature/practice/utils/lastSession";
import { loadLastSession } from "feature/practice/utils/lastSession";
import { LevelProgressCircle } from "feature/profile/components/LevelProgressCircle";
import { PracticeStatsWidget } from "feature/profile/components/PracticeStatsWidget";
import { getTrendData } from "feature/profile/utils/getTrendData";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import type { Song } from "feature/songs/types/songs.type";
import {
  getGatedSkillPower,
  MIN_LEARNED_SONGS_FOR_TIER,
} from "feature/songs/utils/difficulty.utils";
import { getSongTier } from "feature/songs/utils/getSongTier";
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
  const { datasWithReports, year, setYear, isLoading, reportList } =
    useActivityLog(userAuth);
  const [songs, setSongs] = useState<{
    wantToLearn: Song[];
    learning: Song[];
    learned: Song[];
  }>();
  const [lastSession, setLastSession] = useState<LastSessionInfo | null>(null);

  useEffect(() => {
    getUserSongs(userAuth).then((s) => setSongs(s));
  }, [userAuth]);

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
    : "0:00";
  const timeTrendData = getTrendData(datasWithReports, "time");

  const learnedSongsCount = songs?.learned?.length ?? 0;
  const skillPower = songs?.learned ? getGatedSkillPower(songs.learned) : 0;
  const songTier = getSongTier(skillPower > 0 ? skillPower : "?");
  const songsUntilTierUnlocks = Math.max(
    0,
    MIN_LEARNED_SONGS_FOR_TIER - learnedSongsCount,
  );

  const imgPath =
    userInfo?.selectedGuitar ??
    (userStats?.lvl >= IMG_RANKS_NUMBER ? IMG_RANKS_NUMBER : userStats?.lvl);
  const isSpecialGuitar =
    typeof imgPath === "string" && imgPath.includes("special/");
  const specialGuitarDef = isSpecialGuitar
    ? GUITAR_DEFINITIONS.find((g) => g.imageId === imgPath)
    : null;
  const RARITY_COLORS: Record<string, string> = {
    Common: "#9ca3af",
    Uncommon: "#4ade80",
    Rare: "#60a5fa",
    Epic: "#c084fc",
    Legendary: "#fb923c",
    Mythic: "#f43f5e",
  };
  const glowColor = specialGuitarDef
    ? (RARITY_COLORS[specialGuitarDef.rarity] ?? "#0891b2")
    : "#0891b2";

  return (
    <div className='flex flex-col rounded-xl border-none bg-second-600 shadow-sm'>
      <HeroBanner
        title={isTodayCompleted ? "Great job today!" : "Start today's practice"}
        className='min-h-[160px] w-full !flex-row !items-center !justify-between !rounded-none !shadow-none md:min-h-[200px] lg:min-h-[240px]'
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
          <div className='relative flex select-none items-center gap-4 pr-2'>
            <div className='absolute inset-0 rounded-full bg-cyan-400/10 blur-3xl' />

            {/* Song tier badge */}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type='button'
                    onClick={() => router.push("/songs?view=board")}
                    className='relative flex flex-col items-center gap-1.5 rounded-lg p-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-white/5'>
                    <span className='text-[10px] font-semibold tracking-widest text-zinc-400'>
                      Song tier
                    </span>
                    <div
                      className='flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 text-2xl font-black shadow-lg'
                      style={{
                        color: songTier.color,
                        backgroundColor: "rgba(10,10,10,0.9)",
                        borderColor: `${songTier.color}40`,
                      }}>
                      {songTier.tier}
                    </div>
                    <span
                      className='text-[11px] font-medium'
                      style={{ color: songTier.color }}>
                      {songTier.label}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side='bottom'
                  className='max-w-[240px] text-center leading-relaxed text-zinc-800'>
                  {songsUntilTierUnlocks > 0 ? (
                    <>
                      Learn {songsUntilTierUnlocks} more song
                      {songsUntilTierUnlocks > 1 ? "s" : ""} to unlock your
                      tier. It&apos;s a weighted average of your hardest
                      mastered songs, capped by the difficulty of your hardest
                      one — so one hard song alone won&apos;t jump you to a high
                      tier.
                    </>
                  ) : (
                    "Your tier is a weighted average of your hardest mastered songs, capped by the difficulty of your hardest one — so one hard song alone won't jump you to a high tier. Click to see your song board."
                  )}
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
          <div className='flex flex-col gap-3'>
            <div className='flex flex-row flex-wrap items-center gap-3'>
              <button
                onClick={() => router.push("/timer")}
                className='group/btn flex items-center gap-2 rounded-[8px] bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all duration-300 active:scale-95'>
                Practice
                <ArrowRight className='h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1' />
              </button>
            </div>
            {lastSession && (
              <button
                onClick={() => router.push(lastSession.href)}
                className='group/last flex w-fit max-w-full items-center gap-2 rounded-[8px] bg-zinc-900 px-4 py-2 text-sm text-zinc-300 transition-all duration-300 hover:bg-zinc-800 active:scale-95'>
                <History className='h-4 w-4 shrink-0 text-zinc-500' />
                <span className='text-zinc-500'>Last session:</span>
                <span className='truncate font-semibold text-zinc-200'>
                  {lastSession.title}
                </span>
                <ArrowRight className='h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform duration-300 group-hover/last:translate-x-0.5' />
              </button>
            )}
            {(userStats?.fame ?? 0) >= 30 && (
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => router.push("/arsenal")}
                      className='group/fame flex w-fit items-center gap-2 rounded-[8px] bg-zinc-900 px-4 py-2 text-sm font-normal text-amber-300 transition-all duration-300 hover:bg-zinc-800 active:scale-95'>
                      <img
                        src='/images/coin.png'
                        alt='coin'
                        className='h-5 w-5 shrink-0 object-contain'
                      />
                      {/* Mobile: compact */}
                      <AnimatedNumber
                        value={userStats.fame ?? 0}
                        className='font-bold text-amber-300 md:hidden'
                      />
                      <span className='text-xs text-amber-300/70 md:hidden'>
                        pts
                      </span>
                      <span className='text-xs text-amber-300/40 md:hidden'>
                        ·
                      </span>
                      <span className='text-amber-300 md:hidden'>Arsenal</span>
                      {/* Desktop: full */}
                      <span className='hidden text-amber-300 md:inline'>
                        {(userStats.fame ?? 0).toLocaleString()} Fame Points
                      </span>
                      <span className='hidden text-xs text-amber-300/40 md:inline'>
                        ·
                      </span>
                      <span className='hidden text-amber-300 md:inline'>
                        Arsenal
                      </span>
                      <ArrowRight className='h-3.5 w-3.5 shrink-0 text-amber-300 transition-transform duration-300 group-hover/fame:translate-x-0.5' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className='max-w-[200px] text-center'>
                    <p>
                      Fame points are awarded for likes received and community
                      activity — spend them in the Arsenal.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        }
      />

      <div className='space-y-6 p-4 md:mt-6 md:p-6'>
        <div className='relative z-10'>
          <DashboardSection compact>
            <div className='mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2'>
              <DailyQuestWidget />
              <PracticeStatsWidget
                userStats={userStats}
                totalTimeValue={totalTimeValue}
                trendData={timeTrendData}
                reportList={reportList}
                className='h-full'
              />
            </div>
          </DashboardSection>

          <ActivityLogView
            year={year}
            setYear={setYear}
            datasWithReports={datasWithReports}
            isLoading={isLoading}
          />

          <div className='mb-6 mt-6'>
            <SupportBanner />
          </div>

          {featSlot && featSlot}
        </div>
      </div>
    </div>
  );
};

export default ProfileLandingLayout;
