import { Button } from "assets/components/ui/button";
import { SkillMiniTree } from "feature/skills/SkillMiniTree";
import type { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";
import { motion } from "framer-motion";
import Router from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { StatisticsDataInterface } from "types/api.types";
import { getPointsToLvlUp } from "utils/gameLogic";

import BonusPointsItem from "./components/BonusPointsItem";
import LevelIndicator from "./components/LevelIndicator";

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
}

const RatingPopUp = ({
  ratingData,
  currentUserStats,
  previousUserStats,
  skillPointsGained,
  onClick,
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
    <div className='dialog fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-2 sm:p-4'>
      <div className='modal-box relative mx-auto max-h-[95vh] w-full max-w-xl overflow-hidden rounded-lg bg-second-600 shadow-xl sm:max-h-[90vh] sm:max-w-2xl lg:max-w-4xl'>
        {/* Button to close the modal */}
        <Button
          variant='outline'
          className='btn btn-circle btn-sm absolute right-2 top-2 z-20'
          onClick={() => {
            onClick(false);
            Router.push("/dashboard");
          }}>
          ✕
        </Button>

        {/* Scrollable Content Area */}
        <div className='flex h-full max-h-[95vh] flex-col overflow-y-auto pb-20 sm:max-h-[90vh]'>
          {/* Points Header */}
          <div className='sticky top-0 z-10 bg-second-600 px-3 pb-4 pt-4 sm:px-4 sm:pb-6 md:px-8'>
            <div className='flex flex-col items-center justify-center'>
              <div className='mx-auto w-full rounded-lg border border-second-400/30 bg-gradient-to-r from-second-500 via-second-400/20 to-second-500 px-4 py-3 shadow-md sm:w-fit sm:px-8 sm:py-4'>
                <div className='text-center'>
                  <span className='mb-1 block font-openSans text-base sm:text-lg'>
                    {t("rating_popup.title")}
                  </span>
                  <div className='flex items-center justify-center gap-2'>
                    <span className='text-4xl font-bold text-main-300 sm:text-5xl'>
                      {displayedPoints}
                    </span>
                    <span className='text-2xl sm:text-3xl'>
                      {t("rating_popup.points")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className='flex-1 px-3 sm:px-4 md:px-8'>
            <BonusPointsItem
              bonusPoints={ratingData.bonusPoints}
              actualDayWithoutBreak={currentUserStats.actualDayWithoutBreak}
              achievements={newAchievements}
              isGetNewLevel={isGetNewLevel}
            />

            <div className='mx-auto mb-4 flex w-full justify-center sm:mb-6 sm:w-[90%] md:w-[80%]'>
              <LevelIndicator>{currentLevel}</LevelIndicator>
              <div className='relative mx-2 h-3 w-full bg-second-500 sm:h-4'>
                <motion.div
                  initial={{ width: `${prevProgressPercent}%` }}
                  animate={{ width: `${currProgressPercent}%` }}
                  transition={{ duration: 1.5 }}
                  className='absolute left-0 top-0 h-full rounded-md bg-main-500'
                />
              </div>
              <LevelIndicator>{currentLevel + 1}</LevelIndicator>
            </div>

            {categoriesWithPoints.length > 0 && (
              <div className='mb-6 mt-4 sm:mb-8 sm:mt-6'>
                <h3 className='mb-4 rounded-lg border border-main-300/20 bg-gradient-to-r from-main-300/20 via-main-300/5 to-transparent px-4 py-3 font-openSans text-base font-semibold text-white shadow-sm sm:text-lg'>
                  {t("rating_popup.spend_skill_points")}
                </h3>
                <SkillMiniTree highlightCategories={categoriesWithPoints} />
              </div>
            )}
          </div>
        </div>

        {/* Back Button - Fixed to bottom */}
        <div className='absolute bottom-0 left-0 right-0 z-20 border-t border-second-400/30 bg-gradient-to-t from-second-600 via-second-600 to-second-600/90 p-3 shadow-lg sm:p-4'>
          <div className='container mx-auto flex justify-center'>
            <Button
              onClick={() => {
                onClick(false);
                Router.push("/dashboard");
              }}
              className='btn-primary min-w-[120px] px-4 py-2 text-sm font-medium shadow-md sm:min-w-[140px] sm:px-6 sm:text-base'>
              {t("rating_popup.back")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingPopUp;
