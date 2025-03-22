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

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentLevel(currentUserStats.lvl);
    }, 2000);

    return () => {
      clearTimeout(timeout);
    };
  }, [currentUserStats.lvl]);

  const { t } = useTranslation("report");
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
    <div className='dialog relative '>
      <div className='modal-box relative w-full bg-second-600 p-4 md:p-12 lg:min-w-[800px]'>
        <Button
          variant='outline'
          className='btn btn-circle btn-sm absolute right-2 top-2'
          onClick={() => {
            onClick(false);
            Router.push("/");
          }}>
          ✕
        </Button>

        <p className='py-4 text-5xl'>
          <span className='font-openSans text-lg'>
            {t("rating_popup.title")}
          </span>{" "}
          <span className='text-main-300'>{ratingData.totalPoints}</span>{" "}
          <span className='text-4xl'>{t("rating_popup.points")}</span>
        </p>

        <BonusPointsItem
          bonusPoints={ratingData.bonusPoints}
          actualDayWithoutBreak={currentUserStats.actualDayWithoutBreak}
          achievements={newAchievements}
          isGetNewLevel={isGetNewLevel}
        />

        <div className=' mx-auto flex w-[80%] justify-center'>
          <LevelIndicator>{currentLevel}</LevelIndicator>
          <div className='relative mx-2 h-4 w-full bg-second-500'>
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
          <div className='mt-6'>
            <h3 className='mb-4 font-openSans text-lg font-semibold'>
              {t("rating_popup.spend_skill_points")}
            </h3>
            <SkillMiniTree highlightCategories={categoriesWithPoints} />
          </div>
        )}

        <div className='modal-action'>
          <Button
            onClick={() => {
              onClick(false);
              Router.push("/");
            }}
            className='btn-primary'>
            {t("rating_popup.back")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RatingPopUp;
