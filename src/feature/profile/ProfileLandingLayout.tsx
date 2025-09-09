import { Button } from "assets/components/ui/button";
import ActivityLog from "components/ActivityLog/ActivityLog";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { ActivityChart } from "components/Charts/ActivityChart";
import { HeadDecoration } from "components/HeadDecoration";
import { ExercisePlan } from "feature/exercisePlan/components/ExercisePlan";
import { logger } from "feature/logger/Logger";
import { AchievementWrapper } from "feature/profile/components/Achievement/AchievementWrapper";
import { NavigationCards } from "feature/profile/components/NavigationCards/NavigationCards";
import { PracticeInsights } from "feature/profile/components/PracticeInsights/PracticeInsights";
import type { StatsFieldProps } from "feature/profile/components/StatsField";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { getUserSkills } from "feature/skills/services/getUserSkills";
import { updateUserSkills } from "feature/skills/services/updateUserSkills";
import type { UserSkills } from "feature/skills/skills.types";
import { SkillTree } from "feature/skills/SkillTree";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import type { Song } from "feature/songs/types/songs.type";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Brain, LayoutDashboard, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { StatisticsDataInterface } from "types/api.types";
import { canUpgradeSkill } from "utils/firebase/client/firebase.utils";

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
    <div className='bg-second-600 radius-default'>
      <HeadDecoration title={t("statistics")} />

      {activeSection === "overview" && <NavigationCards />}

      <div className='mt-8 space-y-8 p-6 md:!p-8'>
        <AnimatePresence mode='wait'>
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className='relative z-10'>
            {/* Full Width Layout */}
            <div className='space-y-8'>
              {/* Stats Section - Full Width */}
              <div className='rounded-2xl border border-zinc-700/50 bg-zinc-900/30 p-6 backdrop-blur-sm'>
                <h2 className='mb-6 text-2xl font-bold text-white'>
                  Statystyki
                </h2>
                <StatsSection
                  statsField={statsField}
                  statistics={userStats}
                  datasWithReports={datasWithReports}
                  userSongs={songs}
                  userAuth={userAuth}
                />
              </div>

              {/* Achievements - Full Width */}
              <div className='rounded-2xl border border-zinc-700/50 bg-zinc-900/30 p-6 backdrop-blur-sm'>
                <h2 className='mb-6 text-2xl font-bold text-white'>
                  Osiągnięcia
                </h2>
                <AchievementWrapper userAchievements={achievements} />
              </div>

              {/* Featured Content - Full Width */}
              {featSlot && (
                <div className='rounded-2xl border border-zinc-700/50 bg-zinc-900/30 p-6 backdrop-blur-sm'>
                  <h2 className='mb-6 text-2xl font-bold text-white'>
                    Plan ćwiczeń
                  </h2>
                  {featSlot}
                </div>
              )}

              {/* Activity Log - Full Width - Na sam koniec */}
              <div className='rounded-2xl border border-zinc-700/50 bg-zinc-900/30 p-6 backdrop-blur-sm'>
                <div className='mb-6 flex items-center justify-between'>
                  <h2 className='text-2xl font-bold text-white'>
                    Ostatnia aktywność
                  </h2>
                  <a
                    href='/profile/activity'
                    className='text-sm text-cyan-400 transition-colors hover:text-cyan-300'>
                    Zobacz więcej →
                  </a>
                </div>
                <ActivityLog userAuth={userAuth} />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProfileLandingLayout;
