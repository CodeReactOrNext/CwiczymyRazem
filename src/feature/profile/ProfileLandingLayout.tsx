import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "assets/components/ui/tooltip";
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
import { GettingStartedWidget } from "feature/onboarding/components/GettingStartedWidget/GettingStartedWidget";
import type { LastSessionInfo } from "feature/practice/utils/lastSession";
import { loadLastSession } from "feature/practice/utils/lastSession";
import { LevelProgressCircle } from "feature/profile/components/LevelProgressCircle";
import { PracticeStatsWidget } from "feature/profile/components/PracticeStatsWidget";
import { getTrendData } from "feature/profile/utils/getTrendData";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import type { Song } from "feature/songs/types/songs.type";
import { getGatedSkillPower, MIN_LEARNED_SONGS_FOR_TIER } from "feature/songs/utils/difficulty.utils";
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
  const { datasWithReports, year, setYear, isLoading, reportList } = useActivityLog(userAuth);
  const [songs, setSongs] = useState<{ wantToLearn: Song[]; learning: Song[]; learned: Song[] }>();
  const [lastSession, setLastSession] = useState<LastSessionInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    // getUserSongs reads directly from the client Firestore SDK (WebChannel).
    // On networks where that transport stalls (some proxies / ISPs) the fetch
    // never settles, which would leave the song-tier data stuck forever. Bound
    // each attempt with a timeout, retry once, then fall back to empty lists so
    // the dashboard renders (tier shows "?") instead of hanging — mirroring the
    // activity-log fetch guard.
    const FETCH_TIMEOUT = 10000;
    const MAX_ATTEMPTS = 2;

    const loadSongs = async () => {
      if (!userAuth) return;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS && !cancelled; attempt++) {
        try {
          const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("getUserSongs timeout")), FETCH_TIMEOUT)
          );
          const result = await Promise.race([getUserSongs(userAuth), timeout]);
          if (!cancelled) setSongs(result);
          return;
        } catch (error) {
          if (attempt === MAX_ATTEMPTS && !cancelled) {
            console.error("Failed to load user songs:", error);
            setSongs({ wantToLearn: [], learning: [], learned: [] });
          }
        }
      }
    };

    loadSongs();

    return () => {
      cancelled = true;
    };
  }, [userAuth]);

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



  const learnedSongsCount = songs?.learned?.length ?? 0;
  const skillPower = songs?.learned ? getGatedSkillPower(songs.learned) : 0;
  const songTier = getSongTier(skillPower > 0 ? skillPower : '?');
  const songsUntilTierUnlocks = Math.max(0, MIN_LEARNED_SONGS_FOR_TIER - learnedSongsCount);

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
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => router.push("/songs?view=board")}
                    className="relative flex flex-col items-center gap-1.5 rounded-lg p-1 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <span className="text-[10px] font-semibold tracking-widest text-zinc-400">Song tier</span>
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 text-2xl font-black shadow-lg"
                      style={{ color: songTier.color, backgroundColor: 'rgba(10,10,10,0.9)', borderColor: `${songTier.color}40` }}
                    >
                      {songTier.tier}
                    </div>
                    <span className="text-[11px] font-medium" style={{ color: songTier.color }}>{songTier.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[240px] text-center text-zinc-800 leading-relaxed">
                  {songsUntilTierUnlocks > 0 ? (
                    <>
                      Learn {songsUntilTierUnlocks} more song{songsUntilTierUnlocks > 1 ? "s" : ""} to unlock your tier.
                      It&apos;s a weighted average of your hardest mastered songs, capped by the difficulty of your hardest one — so one hard song alone won&apos;t jump you to a high tier.
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
            {(userStats?.fame ?? 0) >= 30 && (
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => router.push("/arsenal")}
                      className="group/fame flex items-center gap-2 w-fit rounded-[8px] bg-zinc-900 hover:bg-zinc-800 text-amber-300 px-4 py-2 text-sm font-normal transition-all duration-300 active:scale-95"
                    >
                      <img src="/images/coin.png" alt="coin" className="h-5 w-5 object-contain shrink-0" />
                      {/* Mobile: compact */}
                      <AnimatedNumber value={userStats.fame ?? 0} className="md:hidden text-amber-300 font-bold" />
                      <span className="md:hidden text-amber-300/70 text-xs">pts</span>
                      <span className="md:hidden text-amber-300/40 text-xs">·</span>
                      <span className="md:hidden text-amber-300">Arsenal</span>
                      {/* Desktop: full */}
                      <span className="hidden md:inline text-amber-300">
                        {(userStats.fame ?? 0).toLocaleString()} Fame Points
                      </span>
                      <span className="hidden md:inline text-amber-300/40 text-xs">·</span>
                      <span className="hidden md:inline text-amber-300">Arsenal</span>
                      <ArrowRight className="h-3.5 w-3.5 text-amber-300 transition-transform duration-300 group-hover/fame:translate-x-0.5 shrink-0" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px] text-center">
                    <p>Fame points are awarded for likes received and community activity — spend them in the Arsenal.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
