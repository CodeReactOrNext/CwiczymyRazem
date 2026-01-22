import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import {CheckCircle2, Play, Trophy } from "lucide-react";

import type { ActiveChallenge, Challenge } from "../../../backend/domain/models/Challenge";

interface ActiveChallengeBannerProps {
  activeChallenge: ActiveChallenge;
  challengeData: Challenge;
  onStart: (challenge: Challenge) => void;
  onAbandon: (id: string) => void;
}

export const ActiveChallengeBanner = ({ 
  activeChallenge, 
  challengeData, 
  onStart, 
  onAbandon 
 }: ActiveChallengeBannerProps) => {
  const today = new Date().toISOString().split('T')[0];
  const isTodayDone = activeChallenge.lastCompletedDate === today;

  const skillData = guitarSkills.find(s => s.id === challengeData.requiredSkillId);
  const SkillIcon = skillData?.icon;

  return (
    <div className="mb-10 rounded-lg bg-zinc-900 border border-white/5 overflow-hidden relative">
      <div className="p-5 sm:p-6 flex flex-col gap-6 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-zinc-950 rounded-lg flex items-center justify-center text-main shrink-0">
              {SkillIcon ? <SkillIcon size={28} /> : <Trophy size={28} />}
            </div>
            
            <div className="min-w-0">
              <h2 className="text-2xl sm:text-3xl font-black text-white italic tracking-tight mb-2 leading-none">
                {challengeData.title}
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-zinc-500 text-[10px] font-bold tracking-wide">
                  You're working on
                </span>
                <div className="h-1 w-1 rounded-full bg-zinc-700" />
                <span className="text-main text-[11px] font-black italic">
                  Day {activeChallenge.currentDay} of {activeChallenge.totalDays}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {Array.from({ length: activeChallenge.totalDays }).map((_, i) => {
              const isDone = i < activeChallenge.currentDay;
              return (
                <div 
                  key={i}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all",
                    isDone 
                      ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                      : "bg-zinc-800 text-zinc-600"
                  )}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 bg-zinc-950 px-4 py-3 rounded-lg border border-white/5">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-zinc-600 tracking-wide leading-none mb-1">Potential Reward</span>
                <span className="text-xs font-black text-white italic leading-none">{challengeData.rewardDescription} XP</span>
              </div>
              {challengeData.rewardSkillId && (
                <div className="h-6 w-px bg-white/10 mx-1" />
              )}
              {challengeData.rewardSkillId && (
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-zinc-600 tracking-wide leading-none mb-1">
                    {challengeData.rewardSkillId.split('_')[0]}
                  </span>
                  <span className="text-xs font-black text-emerald-400 italic leading-none">+{challengeData.rewardLevel}pts</span>
                </div>
              )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={() => !isTodayDone && onStart(challengeData)}
              disabled={isTodayDone}
              className={cn(
                "w-full sm:w-auto px-8 h-11 rounded-lg font-bold tracking-wide text-[11px] gap-2",
                isTodayDone 
                  ? "bg-zinc-800 text-zinc-500" 
                  : "bg-main hover:bg-main/90 text-black"
              )}
            >
              {isTodayDone ? (
                <><CheckCircle2 size={14} /> Daily Goal Met</>
              ) : (
                <><Play size={14} fill="currentColor" /> Continue Challenge</>
              )}
            </Button>
            
            <button
              onClick={() => onAbandon(activeChallenge.challengeId)}
              className="px-4 py-2 text-zinc-600 hover:text-red-400 text-[10px] font-bold tracking-wide transition-colors"
            >
              Stop this challenge
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

