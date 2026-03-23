import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import MainContainer from "components/MainContainer";
import type { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";
import { motion } from "framer-motion";
import Router from "next/router";
import type { StatisticsDataInterface } from "types/api.types";

import { AchievementsDisplay } from "./components/AchievementsDisplay";
import { LevelUpBanner } from "./components/LevelUpBanner";
import { NextMilestone } from "./components/NextMilestone";
import { SessionStats } from "./components/SessionStats";
import { SkillBalance } from "./components/SkillBalance";
import { SuccessRewardCard } from "./components/SuccessRewardCard";
import { WeeklyInsight } from "./components/WeeklyInsight";
import { useRatingPopUp } from "./hooks/useRatingPopUp";

interface RatingPopUpProps {
  ratingData: ReportDataInterface;
  currentUserStats: StatisticsDataInterface;
  previousUserStats: StatisticsDataInterface;
  onClick?: (val: any) => void;
  activityData?: {
    date: string;
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
  }[];
  hideWrapper?: boolean;
  onRestart?: () => void;
}

const RatingPopUpLayout = ({
  ratingData,
  currentUserStats,
  previousUserStats,
  onClick,
  activityData = [],
  hideWrapper = false,
  onRestart,
}: RatingPopUpProps) => {
  const {
    currentLevel,
    displayedPoints,
    topRef,
    isGetNewLevel,
    newAchievements,
    prevProgressPercent,
    currProgressPercent,
    avgTime,
    sessionBreakdown,
  } = useRatingPopUp({
    ratingData,
    currentUserStats,
    previousUserStats,
    activityData,
  });

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "mx-auto max-w-[1100px] p-4 sm:p-5 space-y-6",
        !hideWrapper && "pb-32 pt-16 sm:pb-10 sm:pt-6"
      )}>
      
      <div ref={topRef} />
      {isGetNewLevel && <LevelUpBanner />}

      <SuccessRewardCard
        displayedPoints={displayedPoints}
        fameEarned={ratingData.fameEarned}
        currentLevel={currentLevel}
        prevProgressPercent={prevProgressPercent}
        currProgressPercent={currProgressPercent}
        skillRewardSkillId={ratingData.skillRewardSkillId}
        skillRewardAmount={ratingData.skillRewardAmount}
        skillPointsGained={ratingData.skillPointsGained}
        onRestart={onRestart}
        onContinue={() => {
          if (onClick) {
            onClick(false);
          } else {
            Router.push("/dashboard");
          }
        }}
      />

      {/* Modern Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6">
          {/* Left Column: Stats & Streak */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-4 lg:gap-6">
              <div className="h-full">
                  <SessionStats
                      time={ratingData.bonusPoints.time}
                      todayTotalTime={activityData.filter(d => new Date(d.date).toDateString() === new Date().toDateString()).reduce((acc, d) => acc + d.techniqueTime + d.theoryTime + d.hearingTime + d.creativityTime, 0)}
                      averageWeeklyTime={avgTime}
                      breakdown={sessionBreakdown}
                  />
              </div>
              <NextMilestone currentUserStats={currentUserStats} />
          </div>

          {/* Right Column: Charts & Balance */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-4 lg:gap-6">
              <WeeklyInsight activityData={activityData} />
              
              <div className={`grid gap-4 lg:gap-6 grid-cols-1 ${newAchievements.length > 0 ? 'lg:grid-cols-2' : ''}`}>
                 <SkillBalance activityData={activityData} />
                 
                 {newAchievements.length > 0 && (
                      <AchievementsDisplay achievements={newAchievements} />
                 )}
              </div>
          </div>
      </div>


    </motion.div>
  );

  if (hideWrapper) return content;

  return (
    <MainContainer noBorder>
      {content}
    </MainContainer>
  );
};

export default RatingPopUpLayout;
