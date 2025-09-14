import ActivityLog from "components/ActivityLog/ActivityLog";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { HeadDecoration } from "components/HeadDecoration";
import { DashboardContainer, DashboardSection } from "components/Layout";
import { AchievementWrapper } from "feature/profile/components/Achievement/AchievementWrapper";
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

  useEffect(() => {
    getUserSongs(userAuth).then((songs) => setSongs(songs));
  }, []);

  useEffect(() => {
    getUserSkills(userAuth).then((skills) => setUserSkills(skills));
  }, [userAuth]);

  return (
    <DashboardContainer>
      <HeadDecoration title={t("statistics")} />

      {activeSection === "overview" && <NavigationCards />}

      {/* Statistics Section */}
      <DashboardSection
        title='Statystyki'
        subtitle='Twój postęp w nauce gitary'
        color='cyan'
        compact>
        <StatsSection
          statsField={statsField}
          statistics={userStats}
          datasWithReports={datasWithReports}
          userSongs={songs}
          userAuth={userAuth}
        />
      </DashboardSection>

      {/* Achievements Section */}
      <DashboardSection
        title='Osiągnięcia'
        subtitle='Twoje trofea i nagrody'
        color='yellow'
        compact>
        <AchievementWrapper userAchievements={achievements} />
      </DashboardSection>

      {/* Exercise Plan Section */}
      {featSlot && (
        <DashboardSection
          title='Plan ćwiczeń'
          subtitle='Twój spersonalizowany program'
          color='green'
          compact>
          {featSlot}
        </DashboardSection>
      )}

      {/* Activity Log Section */}
      <DashboardSection
        title='Ostatnia aktywność'
        subtitle='Twoje ostatnie sesje ćwiczeń'
        color='violet'
        compact
        action={
          <a
            href='/profile/activity'
            className='flex items-center gap-2 rounded-lg bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-400 transition-colors hover:bg-violet-500/20 hover:text-violet-300'>
            Zobacz więcej →
          </a>
        }>
        <ActivityLog userAuth={userAuth} />
      </DashboardSection>
    </DashboardContainer>
  );
};

export default ProfileLandingLayout;
