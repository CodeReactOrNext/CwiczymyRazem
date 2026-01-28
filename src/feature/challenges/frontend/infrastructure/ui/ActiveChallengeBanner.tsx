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
    <div className="mb-10 rounded-lg bg-[#0a0a0a] border border-zinc-900 group relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />

      <div className="p-6 md:p-8 flex flex-col gap-6 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center text-white shrink-0 shadow-lg">
              {SkillIcon ? <SkillIcon size={28} strokeWidth={1.5} /> : <Trophy size={28} strokeWidth={1.5} />}
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="px-1.5 py-0.5 rounded-sm bg-zinc-900 border border-zinc-800 text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
                  Active Journey
                </div>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2 leading-none">
                {challengeData.title}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest">
                  Progress
                </span>
                <div className="h-0.5 w-3 bg-zinc-800" />
                <span className="text-white text-[10px] font-bold uppercase tracking-widest">
                  Day {activeChallenge.currentDay} <span className="text-zinc-600">/ {activeChallenge.totalDays}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
             <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest leading-none">Timeline</span>
             <div className="flex flex-wrap items-center gap-1.5">
               {Array.from({ length: activeChallenge.totalDays }).map((_, i) => {
                 const isDone = i < activeChallenge.currentDay;
                 const isCurrent = i === activeChallenge.currentDay && !isTodayDone;
                 return (
                   <div 
                     key={i}
                     className={cn(
                       "w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-bold transition-all border",
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

          <div className="flex items-center gap-4 bg-[#0d0d0d] px-5 py-4 rounded-lg border border-zinc-900 shadow-lg min-w-[200px]">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-500">
                <Sparkles size={16} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest leading-none">Reward</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-white leading-none">{challengeData.rewardDescription}</span>
                  <span className="text-zinc-600 text-[10px] font-bold uppercase">XP</span>
                </div>
              </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-zinc-900">
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
            <Button
              size="lg"
              onClick={() => !isTodayDone && onStart(challengeData)}
              disabled={isTodayDone}
              className={cn(
                "w-full sm:w-auto px-8 h-12 rounded-lg font-bold tracking-widest text-[10px] uppercase gap-2 transition-all",
                isTodayDone 
                  ? "bg-zinc-900 text-zinc-600 border border-zinc-800" 
                  : "bg-white text-black hover:bg-zinc-100 shadow-md"
              )}
            >
              {isTodayDone ? (
                <><CheckCircle2 size={16} /> Goal achieved</>
              ) : (
                <><Play size={16} fill="currentColor" /> Resume session</>
              )}
            </Button>
            
            <button
              onClick={() => onAbandon(activeChallenge.challengeId)}
              className="px-4 py-2 text-zinc-600 hover:text-white text-[9px] font-bold uppercase tracking-widest transition-all"
            >
              Abandon quest
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-zinc-800">
            <Trophy size={12} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Consistency is power</span>
          </div>
        </div>
      </div>
    </div>
  );
};

