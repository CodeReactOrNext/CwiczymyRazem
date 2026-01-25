import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { DashboardContainer, DashboardSection } from "components/Layout";
import { DailyQuestWidget } from "feature/dashboard/components/DailyQuestWidget";
import { OnboardingCards } from "feature/dashboard/components/OnboardingCards";
import { NavigationCards } from "feature/profile/components/NavigationCards/NavigationCards";
import type { StatsFieldProps } from "feature/profile/components/StatsField";
import { getUserSkills } from "feature/skills/services/getUserSkills";
import type { UserSkills } from "feature/skills/skills.types";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { useTranslation } from "hooks/useTranslation";
import { useEffect, useState } from "react";
import type { StatisticsDataInterface } from "types/api.types";

import { StatsSection } from "./components/StatsSection";

interface LandingLayoutProps {
  statsField: StatsFieldProps[];
  userStats: StatisticsDataInterface;
  featSlot: React.ReactNode;
  userAuth: string;
}

import { useQuery } from "@tanstack/react-query";
import { ActiveChallengeWidget } from "feature/challenges/frontend/infrastructure/ui/ActiveChallengeWidget";

const ProfileLandingLayout = ({
  statsField,
  userStats,
  userAuth,
  featSlot,
}: LandingLayoutProps) => {
  
  const { datasWithReports, year, setYear, isLoading } = useActivityLog(userAuth);
  const { achievements } = userStats;
  const [_userSkills, setUserSkills] = useState<UserSkills>();
  const [activeTab, setActiveTab] = useState<"practice" | "review">("practice");

  /* eslint-disable unused-imports/no-unused-vars */
  const { data: songs, refetch: refreshSongs } = useQuery({
    queryKey: ['userSongs', userAuth],
    queryFn: () => getUserSongs(userAuth),
    enabled: !!userAuth,
  });
  /* eslint-enable unused-imports/no-unused-vars */

  useEffect(() => {
    getUserSkills(userAuth).then((skills) => setUserSkills(skills));
  }, [userAuth]);

  return (
    <DashboardContainer>
      <div className="flex items-center gap-2 mb-8 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50 w-fit">
        <button 
          onClick={() => setActiveTab("practice")}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'practice' ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Practice Now
        </button>
        <button 
          onClick={() => setActiveTab("review")}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'review' ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Review Progress
        </button>
      </div>

      {activeTab === "practice" && (
        <>
          {userStats.points > 0 && <NavigationCards />}
          
          <DashboardSection compact>
            {userStats.points === 0 && <OnboardingCards />}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <ActiveChallengeWidget />
              <DailyQuestWidget />
            </div>

            <StatsSection
              statsField={statsField}
              statistics={userStats}
              datasWithReports={datasWithReports}
              userSongs={songs}
              onSongsChange={refreshSongs}
              userAuth={userAuth}
              achievements={achievements}
              year={year}
              setYear={setYear}
              isLoadingActivity={isLoading}
              mode="practice"
            />
          </DashboardSection>

          {featSlot && featSlot}
        </>
      )}

      {activeTab === "review" && (
        <>
          <DashboardSection compact>
            <StatsSection
              statsField={statsField}
              statistics={userStats}
              datasWithReports={datasWithReports}
              userSongs={songs}
              onSongsChange={refreshSongs}
              userAuth={userAuth}
              achievements={achievements}
              year={year}
              setYear={setYear}
              isLoadingActivity={isLoading}
              mode="review"
            />
          </DashboardSection>
        </>
      )}
    </DashboardContainer>
  );
};

export default ProfileLandingLayout;
