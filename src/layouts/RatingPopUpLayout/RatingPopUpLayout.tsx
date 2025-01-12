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
import { Badge } from "assets/components/ui/badge";
import { UserSkills } from "types/skills.types";
import { MiniSkillTree } from "components/MiniSkillTree/MiniSkillTree";

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
  userSkills: UserSkills;
  onSkillUpgrade: (skillId: string) => void;
}

const RatingPopUp = ({
  ratingData,
  currentUserStats,
  previousUserStats,
  skillPointsGained,
  onClick,
  userSkills,
  onSkillUpgrade,
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
    <div className='dialog relative'>
      <div className='modal-box relative w-full bg-second-600 p-12 lg:min-w-[800px]'>
        <Button
          variant='outline'
          className='btn btn-sm btn-circle absolute right-2 top-2'>
          ✕
        </Button>

        <p className='py-4 text-5xl'>
          <span className='font-openSans text-lg'>
            {t("rating_popup.title")}
          </span>{" "}
          <span className='text-main-300'>{ratingData.totalPoints}</span>{" "}
          <span className='text-4xl'>{t("rating_popup.points")}</span>
        </p>

        <div className='my-6 rounded-lg bg-second-500 p-4'>
          <h3 className='mb-4 text-lg font-semibold'>
            {t("rating_popup.skill_points_gained")}
          </h3>
          <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
            {Object.entries(skillPointsGained).map(
              ([skill, points]) =>
                points > 0 && (
                  <div key={skill} className='text-center'>
                    <Badge
                      variant='outline'
                      className={`
                        px-3 py-1 text-sm
                        ${
                          skill === "technique" &&
                          "border-red-500/30 bg-red-500/5"
                        }
                        ${
                          skill === "theory" &&
                          "border-blue-500/30 bg-blue-500/5"
                        }
                        ${
                          skill === "hearing" &&
                          "border-green-500/30 bg-green-500/5"
                        }
                        ${
                          skill === "creativity" &&
                          "border-purple-500/30 bg-purple-500/5"
                        }
                      `}>
                      +{points} {t(`skills.${skill}`)}
                    </Badge>
                  </div>
                )
            )}
          </div>
        </div>

        {categoriesWithPoints.length > 0 && (
          <div className='mt-6'>
            <h3 className='mb-4 text-lg font-semibold'>
              {t("rating_popup.spend_skill_points")}
            </h3>
            <MiniSkillTree
              userSkills={{
                availablePoints: {
                  technique:
                    (userSkills?.availablePoints?.technique || 0) +
                    skillPointsGained.technique,
                  theory:
                    (userSkills?.availablePoints?.theory || 0) +
                    skillPointsGained.theory,
                  hearing:
                    (userSkills?.availablePoints?.hearing || 0) +
                    skillPointsGained.hearing,
                  creativity:
                    (userSkills?.availablePoints?.creativity || 0) +
                    skillPointsGained.creativity,
                },
                unlockedSkills: userSkills?.unlockedSkills || [],
              }}
              onSkillUpgrade={onSkillUpgrade}
              highlightCategories={categoriesWithPoints}
            />
          </div>
        )}

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
