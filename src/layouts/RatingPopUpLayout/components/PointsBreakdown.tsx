import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { BonusPointsInterface } from "../RatingPopUpLayout";

interface PointsBreakdownProps {
  bonusPoints: BonusPointsInterface;
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

export const PointsBreakdown = ({ bonusPoints }: PointsBreakdownProps) => {
  const { t } = useTranslation("report");
  const { timePoints, additionalPoints, multiplier } = bonusPoints;

  const animatedTimePoints = useCountAnimation(timePoints, 500);
  const animatedAdditionalPoints = useCountAnimation(additionalPoints, 1000);

  const getMultiplierString = (multiplier: number) =>
    "1" + "." + multiplier.toString().split("").pop();

  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="flex items-center justify-center gap-2 rounded-md bg-cyan-500/10 px-3 py-2 backdrop-blur-sm">
          <p className="text-2xl font-bold text-cyan-400 sm:text-3xl">
            x{getMultiplierString(multiplier)}
          </p>
          <p className="text-sm text-white/80 sm:text-base">
            {t("rating_popup.regularity")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="flex items-center justify-center gap-2 rounded-md bg-cyan-500/10 px-3 py-2 backdrop-blur-sm">
          <p className="text-2xl font-bold text-cyan-400 sm:text-3xl">
            +{animatedTimePoints}
          </p>
          <p className="text-sm text-white/80 sm:text-base">
            {t("rating_popup.time")}
          </p>
        </motion.div>
      </div>

      {additionalPoints > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.3 }}
          className="flex items-center justify-center gap-2 rounded-md bg-cyan-500/10 px-3 py-2 backdrop-blur-sm">
          <p className="text-2xl font-bold text-cyan-400 sm:text-3xl">
            +{animatedAdditionalPoints}
          </p>
          <p className="text-sm text-white/80 sm:text-base">
            {t("rating_popup.habits")}
          </p>
        </motion.div>
      )}
    </div>
  );
};
