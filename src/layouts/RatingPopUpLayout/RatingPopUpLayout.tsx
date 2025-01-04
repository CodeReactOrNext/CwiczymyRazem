import Image from "next/image";
import FireSVG from "public/static/images/svg/Fire";
import Lightning from "public/static/images/svg/Lightning";
import blackGuitar from "public/static/images/guitar_black.png";

import OldEffect from "components/OldEffect";
import BonusPointsItem from "./components/BonusPointsItem";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Router from "next/router";
import { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";
import { motion } from "framer-motion";
import { StatisticsDataInterface } from "types/api.types";
import { getPointsToLvlUp } from "utils/gameLogic";
import LevelIndicator from "./components/LevelIndicator";
import { Button } from "assets/components/ui/button";

export interface BonusPointsInterface {
  timePoints: number;
  additionalPoints: number;
  habitsCount: number;
  time: number;
  multiplier: number;
}
interface RatingPopUpProps {
  ratingData: ReportDataInterface;
  currentUserStats: StatisticsDataInterface;
  previousUserStats: StatisticsDataInterface;
  onClick: Dispatch<SetStateAction<boolean>>;
}

const RatingPopUp = ({
  ratingData,
  currentUserStats,
  previousUserStats,
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

  return (
      <div className="dialog relative">
        <div className="modal-box p-12 bg-second-600 relative w-full lg:min-w-[800px]">
          <Button variant="outline" className="btn btn-sm btn-circle absolute right-2 top-2">✕</Button>
         
          <p className="py-4 text-5xl">
         <span className="text-lg font-openSans">{t("rating_popup.title")}</span>  <span className="text-main-300">{ratingData.totalPoints}</span> <span className="text-4xl">{t("rating_popup.points")}</span>
          </p>
          <BonusPointsItem
            bonusPoints={ratingData.bonusPoints}
            actualDayWithoutBreak={currentUserStats.actualDayWithoutBreak}
            achievements={newAchievements}
            isGetNewLevel={isGetNewLevel}
          />
          <div className=" w-[80%] flex mx-auto justify-center">
            <LevelIndicator>{currentLevel}</LevelIndicator>
            <div className="relative mx-2 h-4 w-full bg-second-500">
              <motion.div
                initial={{ width: `${prevProgressPercent}%` }}
                animate={{ width: `${currProgressPercent}%` }}
                transition={{ duration: 1.5 }}
                className="absolute left-0 top-0 h-full rounded-md bg-main-500"
              />
            </div>
            <LevelIndicator>{currentLevel + 1}</LevelIndicator>
          </div>
          
          <div className="modal-action">
            <Button
              onClick={() => {
                onClick(false);
                Router.push("/");
              }}
              className="btn-primary"
            >
              {t("rating_popup.back")}
            </Button>
          </div>
        </div>
      </div>
  );
};

export default RatingPopUp;
