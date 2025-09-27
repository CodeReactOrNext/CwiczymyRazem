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
import { ChevronDown, ChevronUp } from "lucide-react";

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
  const [isAchievementsExpanded, setIsAchievementsExpanded] = useState(false);

  useEffect(() => {
    getUserSongs(userAuth).then((songs) => setSongs(songs));
  }, []);

  useEffect(() => {
    getUserSkills(userAuth).then((skills) => setUserSkills(skills));
  }, [userAuth]);

  return (
    <DashboardContainer>
      {activeSection === "overview" && <NavigationCards />}

      {/* Statistics Section */}
      <DashboardSection color='cyan' compact>
        <StatsSection
          statsField={statsField}
          statistics={userStats}
          datasWithReports={datasWithReports}
          userSongs={songs}
          userAuth={userAuth}
        />
      </DashboardSection>

      {/* Achievements Section - Collapsible */}
      <DashboardSection color='yellow' compact>
        <div className='space-y-4'>
          <button
            onClick={() => setIsAchievementsExpanded(!isAchievementsExpanded)}
            className='flex w-full items-center justify-between rounded-lg bg-white/5 p-4 backdrop-blur-sm transition-all duration-200 hover:bg-white/10'
            aria-expanded={isAchievementsExpanded}>
            <div className='text-left'>
              <h3 className='text-lg font-semibold text-white'>Osiągnięcia</h3>
              <p className='text-sm text-zinc-400'>Twoje trofea i nagrody</p>
            </div>
            <div className='text-white transition-transform duration-200'>
              {isAchievementsExpanded ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </div>
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              isAchievementsExpanded
                ? "max-h-[1000px] opacity-100"
                : "max-h-0 opacity-0"
            }`}>
            <AchievementWrapper userAchievements={achievements} />
          </div>
        </div>
      </DashboardSection>
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

      {featSlot && featSlot}
    </DashboardContainer>
  );
};

export default ProfileLandingLayout;
