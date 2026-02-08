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
}

const RatingPopUpLayout = ({
  ratingData,
  currentUserStats,
  previousUserStats,
  onClick,
  activityData = [],
  hideWrapper = false,
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
        "mx-auto max-w-7xl p-4 sm:p-5 space-y-8",
        !hideWrapper && "pb-32 pt-16 sm:pb-10 sm:pt-10"
      )}>
      
      <div ref={topRef} />
      {isGetNewLevel && <LevelUpBanner />}

      <SuccessRewardCard 
        displayedPoints={displayedPoints}
        currentLevel={currentLevel}
        prevProgressPercent={prevProgressPercent}
        currProgressPercent={currProgressPercent}
      />

      {/* Core Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 h-full">
              <SessionStats
                  time={ratingData.bonusPoints.time}
                  todayTotalTime={ratingData.bonusPoints.time}
                  averageWeeklyTime={avgTime}
                  breakdown={sessionBreakdown}
              />
          </div>

          <div className="lg:col-span-7 space-y-6">
              <WeeklyInsight activityData={activityData} />
              <NextMilestone currentUserStats={currentUserStats} />
          </div>
      </div>

      <div className={`grid gap-6 grid-cols-1 ${newAchievements.length > 0 ? 'lg:grid-cols-3' : ''}`}>
         <div className={newAchievements.length > 0 ? "lg:col-span-2" : ""}>
              <SkillBalance activityData={activityData} />
         </div>

         {newAchievements.length > 0 && (
              <div className="h-full">
                  <AchievementsDisplay achievements={newAchievements} />
              </div>
         )}
      </div>

      <div className='flex justify-center pt-10'>
        <Button
          onClick={() => {
            if (onClick) {
              onClick(false);
            } else {
              Router.push("/dashboard");
            }
          }}
          size='lg'
          className='bg-white text-zinc-950 hover:bg-white/90 px-16 h-14 rounded-lg text-xs font-black uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95'>
          Continue
        </Button>
      </div>
    </motion.div>
  );

  if (hideWrapper) return content;

  return (
    <MainContainer title="Practice Summary">
      {content}
    </MainContainer>
  );
};

export default RatingPopUpLayout;
