import { ActivityLogView } from "components/ActivityLog/ActivityLog";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { DashboardContainer, DashboardSection } from "components/Layout";
import { DailyQuestWidget } from "feature/dashboard/components/DailyQuestWidget";
import { NavigationCards } from "feature/profile/components/NavigationCards/NavigationCards";
import { useRouter } from "next/router";
import type { StatisticsDataInterface } from "types/api.types";

// ActiveChallengeWidget removed
import { ChevronRight } from "lucide-react";
import { GiMetronome } from "react-icons/gi";

import { WeeklyScheduler } from "feature/weeklyScheduler/components/WeeklyScheduler";

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
  const { datasWithReports, year, setYear, isLoading } = useActivityLog(userAuth);

  const todayStr = new Date().toDateString();
  const lastReportDate = userStats?.lastReportDate ? new Date(userStats.lastReportDate).toDateString() : null;
  const isTodayCompleted = lastReportDate === todayStr || datasWithReports.some(d => d.date.toDateString() === todayStr && d.report);

  return (
    <DashboardContainer>
      <div className="space-y-8 py-4">
        <div className="space-y-6">
          {!isTodayCompleted && (
            <div
              onClick={() => router.push("/timer")}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] ring-1 ring-black/5 transition-all duration-500 hover:shadow-[0_40px_80px_rgba(0,0,0,0.15)] hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.99]"
            >
                <div className="relative z-10 flex items-center justify-between gap-6">
                  <div className="space-y-1">

                    <h3 className="text-3xl font-black text-zinc-950 tracking-tight">
                      Start today's practice
                    </h3>

                  </div>

                  <div className="rounded-full bg-zinc-950 text-white px-6 py-3 shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:translate-x-1 flex items-center gap-3">
                    <span className="font-black uppercase tracking-widest text-[10px]">
                      Choose mode
                    </span>
                    <ChevronRight className="h-5 w-5" strokeWidth={3} />
                  </div>
                </div>

                <div className="absolute top-1/2 -translate-y-1/2 right-48 rotate-[-12deg] text-zinc-950/5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-6deg]">
                  <GiMetronome size={120} />
                </div>
            </div>
          )}

          <div className="mb-6">
            <WeeklyScheduler userAuth={userAuth as string} />
          </div>

          <NavigationCards />
        </div>

        <div>
          <DashboardSection compact>
            <div className="grid grid-cols-1 gap-4 mb-6">
              <DailyQuestWidget />
            </div>
          </DashboardSection>
        </div>

        <ActivityLogView
          year={year}
          setYear={setYear}
          datasWithReports={datasWithReports}
          isLoading={isLoading}
        />

        {featSlot && featSlot}
      </div>
    </DashboardContainer>
  );
};

export default ProfileLandingLayout;
