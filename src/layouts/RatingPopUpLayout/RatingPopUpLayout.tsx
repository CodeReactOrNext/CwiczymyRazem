import React from "react";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import type { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";
import { motion } from "framer-motion";
import MainContainer from "components/MainContainer";
import Router from "next/router";
import { useTranslation } from "react-i18next";
import type { StatisticsDataInterface } from "types/api.types";
import { Trophy } from "lucide-react";

import { WeeklyInsight } from "./components/WeeklyInsight";
import { NextMilestone } from "./components/NextMilestone";
import { SkillBalance } from "./components/SkillBalance";
import { SessionStats } from "./components/SessionStats";
import { LevelUpBanner } from "./components/LevelUpBanner";
import { AchievementsDisplay } from "./components/AchievementsDisplay";
import { useRatingPopUp } from "./hooks/useRatingPopUp";
import { SuccessRewardCard } from "./components/SuccessRewardCard";

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
  const { t } = useTranslation("report") as any;
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <NextMilestone currentUserStats={currentUserStats} pointsGained={ratingData.totalPoints} />
                  <div className="bg-zinc-900/40 rounded-lg p-8 flex flex-col justify-center backdrop-blur-xl border-none">
                       <div className="flex items-center gap-4 mb-4">
                          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                              <Trophy className="h-5 w-5" />
                          </div>
                          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Practice Goal</h4>
                       </div>
                       <p className="text-lg font-bold text-zinc-300 leading-snug">
                          Active <span className="text-white font-black">{currentUserStats.actualDayWithoutBreak} day</span> streak! 
                          <br/>Stay consistent Riffer!
                       </p>
                  </div>
              </div>
          </div>
      </div>

      <div className='grid gap-6 grid-cols-1 lg:grid-cols-3'>
         <div className="lg:col-span-2">
              <SkillBalance activityData={activityData} />
         </div>
         
         <div className="h-full">
              {newAchievements.length > 0 && (
                  <AchievementsDisplay achievements={newAchievements} />
              )}
         </div>
      </div>

      <div className='flex justify-center pt-10 border-t border-white/5'>
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
