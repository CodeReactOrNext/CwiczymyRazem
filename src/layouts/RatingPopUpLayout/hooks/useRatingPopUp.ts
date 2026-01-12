import { useState, useEffect, useRef } from "react";
import type { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";
import type { StatisticsDataInterface } from "types/api.types";
import { getPointsToLvlUp } from "utils/gameLogic";

interface UseRatingPopUpProps {
  ratingData: ReportDataInterface;
  currentUserStats: StatisticsDataInterface;
  previousUserStats: StatisticsDataInterface;
  activityData?: {
    date: string;
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
  }[];
}

export const useRatingPopUp = ({
  ratingData,
  currentUserStats,
  previousUserStats,
  activityData = [],
}: UseRatingPopUpProps) => {
  const [currentLevel, setCurrentLevel] = useState(previousUserStats.lvl);
  const [displayedPoints, setDisplayedPoints] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "auto", block: "start" });
    }

    const timeout = setTimeout(() => {
      setCurrentLevel(currentUserStats.lvl);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [currentUserStats.lvl]);

  useEffect(() => {
    setDisplayedPoints(0);
    const totalPoints = ratingData.totalPoints;
    if (totalPoints <= 0) return;

    const duration = 1500;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const nextValue = Math.floor(easedProgress * totalPoints);

      setDisplayedPoints(nextValue);

      if (progress >= 1) {
        clearInterval(interval);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [ratingData.totalPoints]);

  const isGetNewLevel = currentUserStats.lvl > previousUserStats.lvl;
  const newAchievements = currentUserStats.achievements.filter(
    (x) => !previousUserStats.achievements.includes(x)
  );

  const levelXpStart = currentUserStats.lvl === 1 ? 0 : getPointsToLvlUp(currentUserStats.lvl - 1);
  const levelXpEnd = getPointsToLvlUp(currentUserStats.lvl);
  const pointsInThisLevel = currentUserStats.points - levelXpStart;
  const levelXpDifference = levelXpEnd - levelXpStart;

  const prevProgressPercent = ((pointsInThisLevel - ratingData.totalPoints) / levelXpDifference) * 100;
  const currProgressPercent = Math.min((pointsInThisLevel / levelXpDifference) * 100, 100);

  const last7Days = activityData.slice(-7);
  const avgTime = last7Days.length > 0
    ? last7Days.reduce((acc, day) =>
      acc + day.techniqueTime + day.theoryTime + day.hearingTime + day.creativityTime, 0
    ) / last7Days.length
    : 0;

  const sessionBreakdown = {
    technique: (currentUserStats.time?.technique || 0) - (previousUserStats.time?.technique || 0),
    theory: (currentUserStats.time?.theory || 0) - (previousUserStats.time?.theory || 0),
    hearing: (currentUserStats.time?.hearing || 0) - (previousUserStats.time?.hearing || 0),
    creativity: (currentUserStats.time?.creativity || 0) - (previousUserStats.time?.creativity || 0),
  };

  return {
    currentLevel,
    displayedPoints,
    topRef,
    isGetNewLevel,
    newAchievements,
    prevProgressPercent,
    currProgressPercent,
    avgTime,
    sessionBreakdown,
  };
};
