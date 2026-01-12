import React from "react";
import { Button } from "assets/components/ui/button";
import type { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";
import { motion } from "framer-motion";
import MainContainer from "components/MainContainer";
import Router from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import type { StatisticsDataInterface } from "types/api.types";
import { Sparkles, Zap, Trophy, Goal } from "lucide-react";

import { WeeklyInsight } from "./components/WeeklyInsight";
import { NextMilestone } from "./components/NextMilestone";
import { SkillBalance } from "./components/SkillBalance";
import { SessionStats } from "./components/SessionStats";
import { LevelUpBanner } from "./components/LevelUpBanner";
import { AchievementsDisplay } from "./components/AchievementsDisplay";
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
}

const RatingPopUpLayout = ({
  ratingData,
  currentUserStats,
  previousUserStats,
  onClick,
  activityData = [],
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

  return (
       <MainContainer title="Practice Summary">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className='mx-auto max-w-7xl p-4 sm:p-5 pb-32 pt-16 sm:pb-10 sm:pt-10 space-y-8'>
        
        <div ref={topRef} />
        {isGetNewLevel && <LevelUpBanner />}

        {/* Global Performance Header */}
        <div className='relative flex flex-col md:flex-row items-center justify-between gap-10 bg-zinc-900/40 p-10 rounded-lg backdrop-blur-3xl shadow-2xl overflow-hidden'>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-30" />
            
            <div className="flex flex-col items-center md:items-start relative z-10">
               <div className="flex items-center gap-2 mb-3 bg-white/5 px-3 py-1 rounded-full">
                    <Zap className="h-3 w-3 text-cyan-400 fill-cyan-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Total Reward</span>
               </div>
               <div className="flex items-baseline gap-4">
                  <span className="text-7xl font-black text-white tracking-tighter">{displayedPoints}</span>
                  <span className="text-2xl font-bold text-zinc-600 uppercase tracking-tighter">pts</span>
               </div>
            </div>
            
            <div className='flex-1 max-w-lg w-full relative z-10 space-y-6'>
                <div className="space-y-3">
                    <div className="flex justify-between items-end px-1">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Tier Evolution</span>
                            <h4 className="text-lg font-bold text-white tracking-tight">Level {currentLevel} <span className="text-zinc-500 mx-1">→</span> {currentLevel+1}</h4>
                        </div>
                        <span className="text-xl font-black text-cyan-500 tabular-nums">{Math.round(currProgressPercent)}%</span>
                    </div>
                    
                    <div className='relative h-3 w-full rounded-full bg-white/5 p-0.5 overflow-hidden shadow-inner'>
                        <motion.div
                            initial={{ width: `${prevProgressPercent}%` }}
                            animate={{ width: `${currProgressPercent}%` }}
                            transition={{ duration: 1.8, ease: "circOut" }}
                            className='relative h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-[length:12px_12px] animate-[progress-stripe_2s_linear_infinite]" />
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>

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

        {/* Global Metrics & Gear */}
        <div className='grid gap-6 grid-cols-1 lg:grid-cols-3'>
           <div className="lg:col-span-2">
                <SkillBalance activityData={activityData} />
           </div>
           
           <div className="h-full">
                {newAchievements.length > 0 ? (
                    <AchievementsDisplay achievements={newAchievements} />
                ) : (
                    <div className="h-full bg-zinc-900/20 border-none rounded-lg p-10 flex flex-col items-center justify-center text-center group hover:bg-zinc-900/30 transition-all duration-500">
                        <div className="h-16 w-16 rounded-lg bg-zinc-800/40 flex items-center justify-center mb-6 shadow-2xl group-hover:scale-105 transition-all">
                            <Goal className="h-8 w-8 text-zinc-700" />
                        </div>
                        <h4 className="text-xs font-black text-zinc-600 uppercase tracking-[0.4em] mb-3">Next Badges</h4>
                        <p className="text-[11px] font-medium text-zinc-700 max-w-[200px] leading-relaxed italic">Daily discipline unlocks technical mastery achievements.</p>
                    </div>
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
            {t("rating_popup.back")}
          </Button>
        </div>
      </motion.div>
    </MainContainer>
  );
};

export default RatingPopUpLayout;
