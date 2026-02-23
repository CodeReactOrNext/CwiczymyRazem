import { ActivityLogView } from "components/ActivityLog/ActivityLog";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { DashboardSection } from "components/Layout";
import { DailyQuestWidget } from "feature/dashboard/components/DailyQuestWidget";
import { NavigationCards } from "feature/profile/components/NavigationCards/NavigationCards";
import { useRouter } from "next/router";
import type { StatisticsDataInterface } from "types/api.types";

// ActiveChallengeWidget removed
import { ChevronRight } from "lucide-react";
import { GiMetronome } from "react-icons/gi";

import { WeeklyScheduler } from "feature/weeklyScheduler/components/WeeklyScheduler";
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
  const { datasWithReports, year, setYear, isLoading } = useActivityLog(userAuth);

  const todayStr = new Date().toDateString();
  const lastReportDate = userStats?.lastReportDate ? new Date(userStats.lastReportDate).toDateString() : null;
  const isTodayCompleted = lastReportDate === todayStr || datasWithReports.some(d => d.date.toDateString() === todayStr && d.report);

  return (
    <div className="bg-second-600 radius-default overflow-hidden flex flex-col shadow-sm border-none">
      {!isTodayCompleted && (
        <HeroBanner
          title="Start today's practice"
          buttonText="Choose mode"
          backgroundImage="/headers/practice.png"
          onClick={() => router.push("/timer")}
          className="w-full !rounded-none !shadow-none md:min-h-[240px] lg:min-h-[280px]"
        />
      )}
      
      <div className="md:mt-6 space-y-6 p-4 md:p-6">
        <div className="relative z-10">
          <div className="space-y-6">
            <div className="mb-6">
              <WeeklyScheduler userAuth={userAuth as string} />
            </div>

            <NavigationCards />
          </div>

          <div className="mt-6">
            <DashboardSection compact>
              <div className="grid grid-cols-1 gap-4 mb-6">
                <DailyQuestWidget />
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
