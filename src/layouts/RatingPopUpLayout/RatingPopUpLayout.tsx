import { Button } from "assets/components/ui/button";
import { SkillMiniTree } from "feature/skills/SkillMiniTree";
import type { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";
import { motion } from "framer-motion";
import MainContainer from "components/MainContainer";
import Router from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { StatisticsDataInterface } from "types/api.types";
import { getPointsToLvlUp } from "utils/gameLogic";

import LevelIndicator from "./components/LevelIndicator";
import { WeeklyActivityChart } from "./components/WeeklyActivityChart";
import { NextMilestone } from "./components/NextMilestone";
import { WeeklySummary } from "./components/WeeklySummary";
import { PerformanceComparison } from "./components/PerformanceComparison";
import { SkillBalance } from "./components/SkillBalance";
import { PointsBreakdown } from "./components/PointsBreakdown";
import { SessionStats } from "./components/SessionStats";
import { LevelUpBanner } from "./components/LevelUpBanner";
import { AchievementsDisplay } from "./components/AchievementsDisplay";

export interface BonusPointsInterface {
  timePoints: number;
  additionalPoints: number;
  habitsCount: number;
  time: number;
  multiplier: number;
}

interface SkillPointsGained {
  technique: number;
  theory: number;
  hearing: number;
  creativity: number;
}

interface RatingPopUpProps {
  ratingData: ReportDataInterface;
  currentUserStats: StatisticsDataInterface;
  previousUserStats: StatisticsDataInterface;
  skillPointsGained: SkillPointsGained;
  onClick: Dispatch<SetStateAction<boolean>>;
  activityData?: {
    date: string;
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
  }[];
}

const RatingPopUp = ({
  ratingData,
  currentUserStats,
  previousUserStats,
  skillPointsGained,
  onClick,
  activityData = [],
}: RatingPopUpProps) => {
  const [currentLevel, setCurrentLevel] = useState(previousUserStats.lvl);
  const [displayedPoints, setDisplayedPoints] = useState(0);
  const { t } = useTranslation("report");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentLevel(currentUserStats.lvl);
    }, 2000);

    return () => {
      clearTimeout(timeout);
    };
  }, [currentUserStats.lvl]);

  // Animation for counting up points
  useEffect(() => {
    if (displayedPoints >= ratingData.totalPoints) return;

    const duration = 1500; // Animation duration in ms
    const totalPoints = ratingData.totalPoints;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      // Easing function for smoother animation
      const easeOutQuad = (t: number) => t * (2 - t);
      const easedProgress = easeOutQuad(progress);

      setDisplayedPoints(Math.floor(easedProgress * totalPoints));

      if (progress >= 1) {
        clearInterval(interval);
        setDisplayedPoints(totalPoints);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [ratingData.totalPoints]);

  const isGetNewLevel = currentUserStats.lvl > previousUserStats.lvl;
  const newAchievements = currentUserStats.achievements.filter(
    (x) => !previousUserStats.achievements.includes(x)
  );

  const levelXpStart =
    currentUserStats.lvl === 1 ? 0 : getPointsToLvlUp(currentUserStats.lvl - 1);
  const levelXpEnd = getPointsToLvlUp(currentUserStats.lvl);

  const pointsInThisLevel = currentUserStats.points - levelXpStart;
  const levelXpDifference = levelXpEnd - levelXpStart;

  const prevProgressPercent =
    ((pointsInThisLevel - ratingData.totalPoints) / levelXpDifference) * 100;
  const currProgressPercent = (pointsInThisLevel / levelXpDifference) * 100;

  // Get categories where points were gained
  const categoriesWithPoints = Object.entries(skillPointsGained)
    .filter(([_, points]) => points > 0)
    .map(([category]) => category);

  return (
    <MainContainer title="Practice Summary">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='mx-auto max-w-6xl p-4 sm:p-5'>
        
        {isGetNewLevel && <LevelUpBanner />}

        <div className='mb-4 rounded-lg border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-cyan-400/5 to-transparent p-4 shadow-lg glass-card'>
          <div className='text-center'>
            <div className='mb-3 flex items-center justify-center gap-2'>
              <span className='text-4xl font-bold text-cyan-400 sm:text-5xl'>
                {displayedPoints}
              </span>
              <span className='text-2xl text-white sm:text-3xl'>
                {t("rating_popup.points")}
              </span>
            </div>
            
            <PointsBreakdown bonusPoints={ratingData.bonusPoints} />
          </div>
        </div>

        {activityData && activityData.length > 0 && (
          <div className='mb-4'>
            <WeeklyActivityChart data={activityData} />
          </div>
        )}

        <div className='mb-4 grid gap-3 sm:grid-cols-2'>
          <NextMilestone currentUserStats={currentUserStats} pointsGained={ratingData.skillPointsGained.technique + ratingData.skillPointsGained.theory + ratingData.skillPointsGained.hearing + ratingData.skillPointsGained.creativity} />
          <WeeklySummary activityData={activityData} />
        </div>

        <div className='mb-4 grid gap-3 sm:grid-cols-2'>
          <PerformanceComparison todayTime={ratingData.bonusPoints.time} activityData={activityData} />
          <SkillBalance activityData={activityData} />
        </div>

        <div className={`mb-4 grid gap-3 ${newAchievements.length > 0 ? 'sm:grid-cols-2' : ''}`}>
          <SessionStats 
            actualDayWithoutBreak={currentUserStats.actualDayWithoutBreak}
            habitsCount={ratingData.bonusPoints.habitsCount}
            time={ratingData.bonusPoints.time}
          />
          {newAchievements.length > 0 && (
            <AchievementsDisplay achievements={newAchievements} />
          )}
        </div>

        <div className='mx-auto mb-6 flex w-full items-center justify-center gap-2 sm:w-[90%] md:w-[80%]'>
          <LevelIndicator>{currentLevel}</LevelIndicator>
          <div className='relative h-4 w-full rounded-full bg-zinc-800/50 backdrop-blur-sm'>
            <motion.div
              initial={{ width: `${prevProgressPercent}%` }}
              animate={{ width: `${currProgressPercent}%` }}
              transition={{ duration: 1.5 }}
              className='absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 shadow-lg'
            />
          </div>
          <LevelIndicator>{currentLevel + 1}</LevelIndicator>
        </div>

        {categoriesWithPoints.length > 0 && (
          <div className='mb-6'>
            <SkillMiniTree highlightCategories={categoriesWithPoints} />
          </div>
        )}

        <div className='mt-8 flex justify-center'>
          <Button
            onClick={() => Router.push("/dashboard")}
            size='lg'
            className='bg-gradient-to-r from-cyan-600 to-cyan-500 px-8 py-3 text-base font-medium text-white shadow-lg hover:from-cyan-500 hover:to-cyan-400'>
            {t("rating_popup.back")}
          </Button>
        </div>
      </motion.div>
    </MainContainer>
  );
};

export default RatingPopUp;
