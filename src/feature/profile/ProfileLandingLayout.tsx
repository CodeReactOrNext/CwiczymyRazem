import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { DashboardContainer, DashboardSection } from "components/Layout";
import { DailyQuestWidget } from "feature/dashboard/components/DailyQuestWidget";
import { OnboardingCards } from "feature/dashboard/components/OnboardingCards";
import { NavigationCards } from "feature/profile/components/NavigationCards/NavigationCards";
import type { StatsFieldProps } from "feature/profile/components/StatsField";
import { getUserSkills } from "feature/skills/services/getUserSkills";
import type { UserSkills } from "feature/skills/skills.types";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { useEffect, useState } from "react";
import { useTranslation } from "hooks/useTranslation";
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
  const { t } = useTranslation("profile");
  
  const { reportList, datasWithReports, year, setYear, isLoading } = useActivityLog(userAuth);
  const { achievements } = userStats;
  const [userSkills, setUserSkills] = useState<UserSkills>();
  const [activeSection, setActiveSection] = useState<
    "overview" | "activity" | "skills" | "exercises"
  >("overview");

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
      {activeSection === "overview" && userStats.points > 0 && <NavigationCards setActiveSection={setActiveSection} />}

      {/* Statistics Section */}
      <DashboardSection color='cyan' compact>
        {userStats.points === 0 && <OnboardingCards />}
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <div className="lg:col-span-2 h-full">
                <ActiveChallengeWidget />
            </div>
            <div className="lg:col-span-2 h-full">
                <DailyQuestWidget />
            </div>
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
        />
      </DashboardSection>

      {/* Activity Chart Section */}


      {featSlot && featSlot}
    </DashboardContainer>
  );
};

export default ProfileLandingLayout;
