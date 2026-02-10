import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { CheckCircle2, Play, Trophy, Sparkles } from "lucide-react";

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
    <div className="mb-10 rounded-lg bg-[#0a0a0a] border border-zinc-900 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />

      <div className="p-5 md:p-6 flex flex-col gap-5 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center text-white shrink-0">
              {SkillIcon ? <SkillIcon size={20} strokeWidth={1.5} /> : <Trophy size={20} strokeWidth={1.5} />}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white tracking-tight leading-tight">
                {challengeData.title}
              </h2>
              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                Day {activeChallenge.currentDay} / {activeChallenge.totalDays}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {Array.from({ length: activeChallenge.totalDays }).map((_, i) => {
              const isDone = i < activeChallenge.currentDay;
              const isCurrent = i === activeChallenge.currentDay && !isTodayDone;
              return (
                <div 
                  key={i}
                  className={cn(
                    "w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold transition-all border",
                    isDone 
                       ? "bg-white border-white text-black shadow-md" 
                       : isCurrent
                        ? "bg-zinc-800 border-zinc-600 text-white"
                        : "bg-zinc-950 border-zinc-900 text-zinc-700"
                  )}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-5 border-t border-zinc-900">
          <Button
            size="lg"
            onClick={() => !isTodayDone && onStart(challengeData)}
            disabled={isTodayDone}
            className={cn(
              "px-6 h-10 rounded-lg font-bold tracking-widest text-[10px] uppercase gap-2 transition-all",
              isTodayDone 
                ? "bg-zinc-900 text-zinc-600 border border-zinc-800" 
                : "bg-white text-black hover:bg-zinc-100 shadow-md"
            )}
          >
            {isTodayDone ? (
              <><CheckCircle2 size={14} /> Done today</>
            ) : (
              <><Play size={14} fill="currentColor" /> Resume</>
            )}
          </Button>
          
          <button
            onClick={() => onAbandon(activeChallenge.challengeId)}
            className="px-4 py-2 text-zinc-600 hover:text-white text-[9px] font-bold uppercase tracking-widest transition-all"
          >
            Abandon
          </button>

          <div className="sm:ml-auto flex items-center gap-3">
            <div className="bg-zinc-900 px-4 py-2 rounded-md flex items-center gap-3">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Daily</span>
              <span className="text-xs font-bold text-white">{challengeData.rewardDescription} XP</span>
            </div>
            <div className="bg-zinc-900 px-4 py-2 rounded-md flex items-center gap-3">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Bonus</span>
              <span className="text-xs font-bold text-emerald-400">
                +{challengeData.rewardLevel || 10} {challengeData.rewardSkillId?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || "Skill"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

