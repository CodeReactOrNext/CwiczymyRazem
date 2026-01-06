import { Trophy, CheckCircle2, Play, XCircle } from "lucide-react";
import { cn } from "assets/lib/utils";
import { ActiveChallenge, Challenge } from "../../../backend/domain/models/Challenge";
import { Button } from "assets/components/ui/button";
import { guitarSkills } from "feature/skills/data/guitarSkills";

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
    <div className="mb-4 rounded-lg bg-zinc-900 border border-white/5 overflow-hidden">
      <div className="p-3 sm:p-4 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-zinc-950 rounded-lg flex items-center justify-center text-main">
              {SkillIcon ? <SkillIcon size={18} /> : <Trophy size={18} />}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded bg-main text-black flex items-center justify-center font-black text-[9px] sm:text-[10px]">
                {activeChallenge.currentDay}
            </div>
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-tight">
                Day {activeChallenge.currentDay} / {activeChallenge.totalDays}
              </span>
            </div>
            <h3 className="text-sm sm:text-lg font-black text-white uppercase italic tracking-tight leading-tight line-clamp-1">
              {challengeData.title}
            </h3>
            
            <div className="flex flex-wrap gap-1 mt-2">
              {Array.from({ length: activeChallenge.totalDays }).map((_, idx) => {
                const dayNum = idx + 1;
                const isCompleted = dayNum < activeChallenge.currentDay || (dayNum === activeChallenge.currentDay && isTodayDone);
                const isCurrent = dayNum === activeChallenge.currentDay && !isTodayDone;
                
                return (
                  <div 
                    key={dayNum} 
                    className={cn(
                      "w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-bold transition-all",
                      isCompleted 
                        ? "bg-main text-white" 
                        : isCurrent 
                          ? "bg-main/20 text-main ring-1 ring-main/30" 
                          : "bg-zinc-800 text-zinc-600"
                    )}
                  >
                    {isCompleted && <CheckCircle2 size={8} strokeWidth={3} />}
                    {!isCompleted && dayNum}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => !isTodayDone && onStart(challengeData)}
            disabled={isTodayDone}
            className={cn(
              "flex-1 h-9 rounded-lg font-black uppercase tracking-wider text-[10px] gap-2",
              isTodayDone ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : ""
            )}
            variant={isTodayDone ? "secondary" : "default"}
          >
            {isTodayDone ? (
              <><CheckCircle2 size={14} /> Done</>
            ) : (
              <><Play size={14} fill="currentColor" /> Practice</>
            )}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onAbandon(activeChallenge.challengeId)}
            className="h-9 px-3 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
          >
            <XCircle size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};
