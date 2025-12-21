import ActivityLog from "components/ActivityLog/ActivityLog";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { HeadDecoration } from "components/HeadDecoration";
import { DashboardContainer, DashboardSection } from "components/Layout";
import { NavigationCards } from "feature/profile/components/NavigationCards/NavigationCards";
import type { StatsFieldProps } from "feature/profile/components/StatsField";
import { getUserSkills } from "feature/skills/services/getUserSkills";
import type { UserSkills } from "feature/skills/skills.types";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import type { Song } from "feature/songs/types/songs.type";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { StatisticsDataInterface } from "types/api.types";

import { StatsSection } from "./components/StatsSection";

interface LandingLayoutProps {
  statsField: StatsFieldProps[];
  userStats: StatisticsDataInterface;
  featSlot: React.ReactNode;
  userAuth: string;
}

const ProfileLandingLayout = ({
  statsField,
  userStats,
  userAuth,
  featSlot,
}: LandingLayoutProps) => {
  const { t } = useTranslation("profile");
  const [songs, setSongs] = useState<{
    wantToLearn: Song[];
    learning: Song[];
    learned: Song[];
  }>();
  const { reportList, datasWithReports } = useActivityLog(userAuth);
  const { achievements } = userStats;
  const [userSkills, setUserSkills] = useState<UserSkills>();
  const [activeSection, setActiveSection] = useState<
    "overview" | "activity" | "skills" | "exercises"
  >("overview");

  const refreshSongs = () => {
    getUserSongs(userAuth).then((songs) => setSongs(songs));
  };

  useEffect(() => {
    refreshSongs();
  }, [userAuth]);

  useEffect(() => {
    getUserSkills(userAuth).then((skills) => setUserSkills(skills));
  }, [userAuth]);

  return (
    <DashboardContainer>
      {activeSection === "overview" && <NavigationCards setActiveSection={setActiveSection} />}

      {/* Statistics Section */}
      <DashboardSection color='cyan' compact>
        <StatsSection
          statsField={statsField}
          statistics={userStats}
          datasWithReports={datasWithReports}
          userSongs={songs}
          onSongsChange={refreshSongs}
          userAuth={userAuth}
          achievements={achievements}
        />
      </DashboardSection>

      {featSlot && featSlot}
    </DashboardContainer>
  );
};

export default ProfileLandingLayout;
