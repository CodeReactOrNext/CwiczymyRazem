import type { AchievementList } from "feature/achievements/achievementsData";
import Achievement from "feature/achievements/components/Achievement";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdUpgrade } from "react-icons/md";
import { convertMsToHM } from "utils/converter";

import type { BonusPointsInterface } from "../../RatingPopUpLayout";

interface BonusPointsItemProps {
  bonusPoints: BonusPointsInterface;
  actualDayWithoutBreak: number;
  achievements: AchievementList[];
  isGetNewLevel: boolean;
}

const useCountAnimation = (targetValue: number, startDelay: number = 0) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (targetValue === 0) return;

    const duration = 1500;
    const startTime = Date.now();

    const timeoutId = setTimeout(() => {
      const interval = setInterval(() => {
        const elapsedTime = Date.now() - startTime - startDelay;

        if (elapsedTime < 0) return; 

        const progress = Math.min(elapsedTime / duration, 1);

        const easeOutQuad = (t: number) => t * (2 - t);
        const easedProgress = easeOutQuad(progress);

        setCount(Math.round(easedProgress * targetValue));

        if (progress >= 1) {
          clearInterval(interval);
          setCount(targetValue);
        }
      }, 16);

      return () => clearInterval(interval);
    }, startDelay);

    return () => clearTimeout(timeoutId);
  }, [targetValue, startDelay]);

  return count;
};

const BonusPointsItem = ({
  bonusPoints,
  actualDayWithoutBreak,
  achievements,
  isGetNewLevel,
}: BonusPointsItemProps) => {
  const { t } = useTranslation(["common", "report"]);
  const { timePoints, additionalPoints, habitsCount, time, multiplier } =
    bonusPoints;

  // Animated counts
  const animatedTimePoints = useCountAnimation(timePoints, 500);
  const animatedAdditionalPoints = useCountAnimation(additionalPoints, 1000);

  const getMulitplierString = (multiplier: number) =>
    "1" + "." + multiplier.toString().split("").pop();

  return (
    <div className='relative mb-6 w-full overflow-hidden rounded-lg border border-second-400/60 bg-gradient-to-b from-second-500/90 to-second-500 font-openSans shadow-lg sm:mb-8'>
      {isGetNewLevel && (
        <motion.div
          initial={{ x: "-120%", opacity: "0%" }}
          animate={{ x: 0, opacity: "100%" }}
          transition={{ delay: 2 }}
          className='mb-3 border-b border-second-400/30 bg-gradient-to-r from-main-300/20 to-transparent px-4 py-3 sm:mb-4 sm:px-8 sm:py-4'>
          <div className='flex items-center gap-2 text-white sm:gap-3'>
            <MdUpgrade className='text-3xl text-main-300 sm:text-4xl' />
            <p className='text-xl font-semibold sm:text-2xl'>
              {t("report:rating_popup.new_level")}
            </p>
          </div>
        </motion.div>
      )}

      <div className='px-4 py-4 sm:px-8 sm:py-6'>
        <div className='grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2'>
          <motion.div
            initial={{ x: "-120%", opacity: "0%" }}
            animate={{ x: 0, opacity: "100%" }}
            transition={{ delay: 1, duration: 0.3 }}
            className='mb-2 rounded-md bg-second-400/20 p-3 backdrop-blur-sm transition-colors hover:bg-second-400/30 sm:p-4'>
            <div className='flex items-center gap-2 sm:gap-3'>
              <p className='font-sans text-3xl font-bold text-main-300 sm:text-4xl'>
                x{getMulitplierString(multiplier)}
              </p>
              <p className='text-sm text-white sm:text-base'>
                {t("report:rating_popup.regularity")}
              </p>
            </div>
          </motion.div>

          {/* Time Points Section */}
          <motion.div
            initial={{ x: "-120%", opacity: "0%" }}
            animate={{ x: 0, opacity: "100%" }}
            transition={{ delay: 1.3, duration: 0.3 }}
            className='mb-2 rounded-md bg-second-400/10 p-3 backdrop-blur-sm transition-colors hover:bg-second-400/20 sm:p-4'>
            <div className='flex items-center gap-2 sm:gap-3'>
              <p className='font-sans text-3xl font-bold text-main-300 sm:text-4xl'>
                +{animatedTimePoints}
              </p>
              <p className='text-sm text-white sm:text-base'>
                {t("report:rating_popup.time")}
              </p>
            </div>
          </motion.div>
        </div>

        {additionalPoints ? (
          <motion.div
            initial={{ x: "-120%", opacity: "0%" }}
            animate={{ x: 0, opacity: "100%" }}
            transition={{ delay: 1.5, duration: 0.3 }}
            className='my-3 rounded-md bg-second-400/15 p-3 backdrop-blur-sm transition-colors hover:bg-second-400/25 sm:my-4 sm:p-4'>
            <div className='flex items-center gap-2 sm:gap-3'>
              <p className='font-sans text-3xl font-bold text-main-300 sm:text-4xl'>
                +{animatedAdditionalPoints}
              </p>
              <p className='text-sm text-white sm:text-base'>
                {t("report:rating_popup.habits")}
              </p>
            </div>
          </motion.div>
        ) : null}

        {/* Achievements Section */}
        {achievements.length > 0 && (
          <motion.div
            initial={{ x: "-120%", opacity: "0%" }}
            animate={{ x: 0, opacity: "100%" }}
            transition={{ delay: 1.7, duration: 0.3 }}
            className='my-3 rounded-md bg-second-400/20 p-3 backdrop-blur-sm sm:my-4 sm:p-4'>
            <div className='flex flex-col gap-2'>
              <p className='text-sm font-medium text-white sm:text-base'>
                {t("report:rating_popup.new_achievements")}
              </p>
              <div className='flex flex-wrap gap-2 p-1 sm:gap-3 sm:p-2'>
                {achievements.map((id) => (
                  <Achievement key={id} id={id} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div className='mt-3 rounded-md border-t border-second-400/30 bg-second-400/10 p-2.5 sm:mt-4 sm:p-3'>
          <div className='grid gap-1.5 text-xs text-secondText sm:gap-2 sm:text-sm'>
            <p className='flex items-center gap-2'>
              <span className='h-1.5 w-1.5 rounded-full bg-main-300 sm:h-2 sm:w-2'></span>
              <span className='font-bold text-white'>{actualDayWithoutBreak}</span>{" "}
              streak
            </p>
            <p className='flex items-center gap-2'>
              <span className='h-1.5 w-1.5 rounded-full bg-main-300 sm:h-2 sm:w-2'></span>
             you have adopted {habitsCount} healthy habit
            </p>
            <p className='flex items-center gap-2'>
              <span className='h-1.5 w-1.5 rounded-full bg-main-300 sm:h-2 sm:w-2'></span>
              {t("report:rating_popup.time_amount")}{" "}
              <span className='font-bold text-white'>{convertMsToHM(time)}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BonusPointsItem;
