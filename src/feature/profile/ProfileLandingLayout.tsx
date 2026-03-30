import { ActivityLogView } from "components/ActivityLog/ActivityLog";
import { ArrowRight, Plus, Gem } from "lucide-react";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { DashboardSection } from "components/Layout";
import { DailyQuestWidget } from "feature/dashboard/components/DailyQuestWidget";
import { NavigationCards } from "feature/profile/components/NavigationCards/NavigationCards";
import { StatsField } from "feature/profile/components/StatsField";
import { getTrendData } from "feature/profile/utils/getTrendData";
import { useRouter } from "next/router";
import { selectUserInfo } from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";
import type { StatisticsDataInterface } from "types/api.types";
import { convertMsToHM } from "utils/converter";
import { FaClock } from "react-icons/fa";

// ActiveChallengeWidget removed
import { WeeklyHorizontalTimeline } from "feature/weeklyScheduler/components/WeeklyHorizontalTimeline";
import { HeroBanner } from "components/UI/HeroBanner";

interface LandingLayoutProps {
  userStats: StatisticsDataInterface;
  featSlot: React.ReactNode;
  userAuth: string;
}

const ProfileLandingLayout = ({
  userStats,
  userAuth,
  featSlot,
}: LandingLayoutProps) => {
  const router = useRouter();
  const userInfo = useAppSelector(selectUserInfo);
  const { datasWithReports, year, setYear, isLoading } = useActivityLog(userAuth);

  const todayStr = new Date().toDateString();
  const lastReportDate = userStats?.lastReportDate ? new Date(userStats.lastReportDate).toDateString() : null;
  const isTodayCompleted = lastReportDate === todayStr || datasWithReports.some(d => d.date.toDateString() === todayStr && d.report);

  const totalTimeValue = userStats ? convertMsToHM(
    userStats.time.technique + userStats.time.theory + userStats.time.creativity + userStats.time.hearing
  ) : "0:00";
  const timeTrendData = getTrendData(datasWithReports, "time");

  return (
    <div className="bg-second-600 rounded-xl flex flex-col shadow-sm border-none lg:mt-16">
      <HeroBanner
        title={isTodayCompleted ? "Great job today!" : "Start today's practice"}
        characterImage="/images/3d/guitarist.png"
        secondaryImage="/images/3d/metronom.png"
        className="w-full !rounded-none !shadow-none min-h-[220px] md:min-h-[200px] lg:min-h-[240px]"
        leftContent={
          <div className="flex flex-col gap-3">
            <div className="flex flex-row flex-wrap gap-3 items-center">
              <button
                onClick={() => router.push("/profile/exercises?view=create")}
                className="group/btn rounded-none md:rounded-md bg-zinc-800/80 backdrop-blur-md border border-white/10 text-white px-5 py-2.5 text-sm font-semibold transition-all duration-300 flex items-center gap-2 hover:bg-zinc-700/80 active:scale-95"
              >
                Create plan
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => router.push("/timer")}
                className="group/btn rounded-none md:rounded-md bg-white text-zinc-950 px-5 py-2.5 text-sm font-semibold transition-all duration-300 flex items-center gap-2 active:scale-95"
              >
                Choose mode
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </button>
            </div>
            {(userStats?.fame ?? 0) >= 30 && (
              <button
                onClick={() => router.push("/arsenal")}
                className="group/fame flex items-center gap-2 w-fit rounded-none md:rounded-md bg-zinc-800/80 backdrop-blur-md border border-orange-500/30 hover:border-orange-400/60 hover:bg-zinc-700/80 text-white px-4 py-2 text-sm font-semibold transition-all duration-300 active:scale-95"
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
          <div className="space-y-6">
            <NavigationCards />
          </div>

          <div className="mt-6">
            <DashboardSection compact>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <DailyQuestWidget />
                <StatsField
                  Icon={FaClock}
                  description="Total Time"
                  value={totalTimeValue}
                  trendData={timeTrendData}
                  className="h-full"
                  footerLink={{ href: "/profile/activity", label: "View activity" }}
                />
              </div>
            </DashboardSection>
          </div>

          {(userInfo?.role === "pro" || userInfo?.role === "master" || userInfo?.role === "admin") && (
            <div className="mt-6">
              <WeeklyHorizontalTimeline userAuth={userAuth as string} />
            </div>
          )}

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
