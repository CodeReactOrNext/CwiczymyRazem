import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { LayoutDashboard, Activity, Music, Brain } from "lucide-react";

import Calendar from "components/Calendar";
import StatisticBar from "./components/StatisticBar";
import HeadDecoration from "./components/HeadDecoration";
import StatsField, { StatsFieldProps } from "./components/StatsField";
import AchievementWrapper from "./components/Achievement/AchievementWrapper";
import { SongLearningSection } from "feature/songs/components/SongLearningSection/SongLearningSection";
import { ActivityChart } from "components/Charts/ActivityChart";
import { useCalendar } from "components/Calendar/useCalendar";
import { SkillTree } from "components/SkillTree/SkillTree";

import { StatisticsDataInterface } from "types/api.types";
import { convertMsToHM, calculatePercent } from "utils/converter";
import {
  getUserSongs,
  getUserSkills,
  updateUserSkills,
  canUpgradeSkill,
} from "utils/firebase/client/firebase.utils";
import { Song } from "utils/firebase/client/firebase.types";
import { UserSkills } from "types/skills.types";
import { guitarSkills } from "src/data/guitarSkills";
import { Button } from "assets/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

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
  const { reportList } = useCalendar(userAuth);
  const { time, achievements } = userStats;
  const totalTime =
    time.technique + time.theory + time.hearing + time.creativity;
  const [userSkills, setUserSkills] = useState<UserSkills>();
  const [activeSection, setActiveSection] = useState<
    "overview" | "activity" | "songs" | "skills"
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
      console.error("Failed to upgrade skill");
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <>
            <div className='flex flex-col lg:flex-row lg:gap-4'>
              <div className='grid h-fit grid-flow-row grid-cols-2 gap-4 md:grid-cols-3 lg:flex-1'>
                {statsField.map(({ Icon, description, value }) => (
                  <StatsField
                    key={description}
                    Icon={Icon}
                    description={description}
                    value={value}
                  />
                ))}
              </div>
              <div className='content-box relative z-20 mb-2  flex content-around justify-center lg:flex-1'>
                <StatisticBar
                  title={t("technique")}
                  value={convertMsToHM(time.technique)}
                  percent={calculatePercent(time.technique, totalTime)}
                />
                <StatisticBar
                  title={t("theory")}
                  value={convertMsToHM(time.theory)}
                  percent={calculatePercent(time.theory, totalTime)}
                />
                <StatisticBar
                  title={t("hearing")}
                  value={convertMsToHM(time.hearing)}
                  percent={calculatePercent(time.hearing, totalTime)}
                />
                <StatisticBar
                  title={t("creativity")}
                  value={convertMsToHM(time.creativity)}
                  percent={calculatePercent(time.creativity, totalTime)}
                />
              </div>
            </div>

            <div className='my-2 mb-2 flex flex-col justify-between'>
              <AchievementWrapper userAchievements={achievements} />
            </div>
          </>
        );
      case "activity":
        return (
          <>
            <ActivityChart data={reportList as any} />
            <div className='d-flex justify-content-center mt-6'>
              <Calendar userAuth={userAuth} />
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
    }
  };

  return (
    <div className='bg-second-600 radius-default'>
      <HeadDecoration title={t("statistics")} />

      <div className='relative z-10 flex flex-wrap gap-2 border-b border-second-500 p-4'>
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
      </div>

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
        <div className='col-span-2'>{featSlot}</div>
      </div>
    </div>
  );
};

export default ProfileLandingLayout;
