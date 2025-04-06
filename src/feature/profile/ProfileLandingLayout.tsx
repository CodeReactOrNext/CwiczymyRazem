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
import { SongLearningSection } from "feature/songs/components/SongLearningSection/SongLearningSection";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import type { Song } from "feature/songs/types/songs.type";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Brain, LayoutDashboard, Music, Timer } from "lucide-react";
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
    "overview" | "activity" | "songs" | "skills" | "exercises"
  >("overview");

  useEffect(() => {
    getUserSongs(userAuth).then((songs) => setSongs(songs));
  }, []);

  useEffect(() => {
    getUserSkills(userAuth).then((skills) => setUserSkills(skills));
  }, [userAuth]);

  const handleSkillUpgrade = async (skillId: string) => {
    if (!userSkills) return;

    const skill = guitarSkills.find((s) => s.id === skillId);
    if (!skill) return;

    if (!canUpgradeSkill(skill, userSkills)) {
      return;
    }

    const success = await updateUserSkills(userAuth, skillId);

    if (success) {
      const updatedSkills = await getUserSkills(userAuth);
      setUserSkills(updatedSkills);
    } else {
      logger.error("Failed to upgrade skill");
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <>
            <StatsSection
              statsField={statsField}
              statistics={userStats}
              datasWithReports={datasWithReports}
            />
            <div className='my-2 mb-2 flex flex-col justify-between'>
              <AchievementWrapper userAchievements={achievements} />
            </div>
            <div className='col-span-2'>{featSlot}</div>
          </>
        );
      case "activity":
        return (
          <>
            <div className='flex flex-col gap-4 font-openSans'>
              <PracticeInsights statistics={userStats} />
              <ActivityChart data={reportList as any} />
            </div>
            <div className='d-flex justify-content-center mt-6'>
              <ActivityLog userAuth={userAuth} />
            </div>
          </>
        );
      case "songs":
        return (
          songs && (
            <SongLearningSection
              isLanding
              userSongs={{
                learned: songs?.learned,
                learning: songs?.learning,
                wantToLearn: songs?.wantToLearn,
              }}
              onChange={(songs) => setSongs(songs)}
            />
          )
        );
      case "skills":
        return (
          userSkills && (
            <SkillTree
              userSkills={userSkills}
              onSkillUpgrade={handleSkillUpgrade}
            />
          )
        );
      case "exercises":
        return (
          <div className='w-full'>
            <ExercisePlan />
          </div>
        );
    }
  };

  return (
    <div className='bg-second-600 radius-default'>
      <HeadDecoration title={t("statistics")} />

      <div className='relative z-10 flex flex-wrap justify-between gap-2 border-b border-second-500 p-4 md:justify-around'>
        <Button
          variant={activeSection === "overview" ? "default" : "ghost"}
          onClick={() => setActiveSection("overview")}>
          <LayoutDashboard className='mr-2 h-4 w-4' />
          {t("nav.overview")}
        </Button>
        <Button
          variant={activeSection === "activity" ? "default" : "ghost"}
          onClick={() => setActiveSection("activity")}>
          <Activity className='mr-2 h-4 w-4' />
          {t("nav.activity")}
        </Button>
        <Button
          variant={activeSection === "songs" ? "default" : "ghost"}
          onClick={() => setActiveSection("songs")}>
          <Music className='mr-2 h-4 w-4' />
          {t("nav.songs")}
        </Button>
        <Button
          variant={activeSection === "skills" ? "default" : "ghost"}
          onClick={() => setActiveSection("skills")}>
          <Brain className='mr-2 h-4 w-4' />
          {t("nav.skills")}
        </Button>
        <Button
          variant={activeSection === "exercises" ? "default" : "ghost"}
          onClick={() => setActiveSection("exercises")}>
          <Timer className='mr-2 h-4 w-4' />
          {t("nav.exercises")}
        </Button>
      </div>

      {activeSection === "overview" && (
        <NavigationCards setActiveSection={setActiveSection} />
      )}

      <div className='grid-rows-auto grid-cols-1 items-start gap-6 p-3 md:grid-cols-2 md:!p-6 lg:grid'>
        <AnimatePresence mode='wait'>
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className='relative z-10 col-span-2'>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProfileLandingLayout;
