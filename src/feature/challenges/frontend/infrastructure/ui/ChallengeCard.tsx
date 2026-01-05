import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { Challenge } from "../../../backend/domain/models/Challenge";
import { Lock, Timer, Calendar, ChevronRight, CheckCircle2, Play } from "lucide-react";
import { motion } from "framer-motion";

interface ChallengeCardProps {
  challenge: Challenge;
  isUnlocked: boolean;
  currentLevel: number;
  onStart: (challenge: Challenge) => void;
  onAdd: (challenge: Challenge) => void;
  hasActiveChallenge?: boolean;
  isActive?: boolean;
  isDependencyMet?: boolean;
  isCompleted?: boolean;
}

export const ChallengeCard = ({
  challenge,
  isUnlocked,
  currentLevel,
  onStart,
  onAdd,
  hasActiveChallenge = false,
  isActive = false,
  isDependencyMet = true,
  isCompleted = false,
}: ChallengeCardProps) => {
  const progress = Math.min((currentLevel / challenge.requiredLevel) * 100, 100);

  return (
    <div
      className={cn(
        "relative flex flex-col h-full rounded-2xl border transition-all duration-500 overflow-hidden",
        isCompleted
          ? "bg-zinc-900 border-main/30 shadow-[0_0_20px_rgba(var(--main-rgb),0.05)]"
          : isUnlocked 
            ? "bg-zinc-900 border-zinc-800 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] hover:border-main/50 hover:shadow-[0_0_20px_rgba(var(--main-rgb),0.1)]"
            : "bg-zinc-900/30 border-white/5 opacity-50 grayscale"
      )}
    >
      {isCompleted && (
        <div className="absolute top-0 right-0 p-2">
            <CheckCircle2 size={16} className="text-main shadow-sm" />
        </div>
      )}
      <div className="flex flex-col h-full p-4">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-3">
            {!isUnlocked ? (
              <div className="flex items-center gap-2">
                  <Lock size={10} className="text-zinc-600" />
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter">LVL {challenge.requiredLevel}</span>
              </div>
            ) : (
                <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold uppercase">
                    <Calendar size={12} />
                    {challenge.streakDays} Days
                </div>
            )}
            {isCompleted && (
               <span className="text-[8px] font-black text-main uppercase tracking-tighter ml-auto">MASTERED</span>
            )}
        </div>

        {/* Title & Description */}
        <div className={cn(isUnlocked ? "mb-4" : "mb-0")}>
          <h3 className={cn(
            "font-bold text-white mb-1 tracking-tight",
            isUnlocked ? "text-lg" : "text-base opacity-50"
          )}>
            {challenge.title}
          </h3>
          <p className={cn(
            "text-xs leading-relaxed line-clamp-2",
            isUnlocked ? "text-zinc-400" : "text-zinc-600 italic"
          )}>
            {challenge.description}
          </p>
        </div>

        {isUnlocked && (
          <>
            {/* Goal / Benefit */}
            <div className="mt-auto pt-3 border-t border-white/5">
                <div className="flex flex-col gap-1 mb-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Goal</span>
                        <span className="text-[9px] font-bold text-zinc-300">{challenge.shortGoal}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Reward</span>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black text-main uppercase">{challenge.rewardDescription}</span>
                            {challenge.rewardSkillId && (
                                <span className="text-[8px] font-bold text-main/80 uppercase">
                                    +Lvl {challenge.rewardLevel} {challenge.rewardSkillId.replace('_', ' ')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    {isActive ? (
                        <Button
                            onClick={() => onStart(challenge)}
                            className="flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-[9px] bg-main text-white hover:bg-main-600 shadow-lg shadow-main/20 animate-pulse"
                        >
                            <span className="flex items-center justify-center gap-2">Practice <Play size={10} fill="currentColor" /></span>
                        </Button>
                    ) : isCompleted ? (
                        <Button
                            disabled
                            className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-not-allowed"
                        >
                            Mastered
                        </Button>
                    ) : (
                        <>
                            <Button
                                disabled={hasActiveChallenge}
                                onClick={() => !hasActiveChallenge && onAdd(challenge)}
                                className={cn(
                                    "flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all",
                                    !hasActiveChallenge 
                                        ? "bg-zinc-800 text-white hover:bg-zinc-700 border border-white/5" 
                                        : "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-white/5"
                                )}
                            >
                                Add
                            </Button>
                            <Button
                                disabled={hasActiveChallenge}
                                onClick={() => !hasActiveChallenge && onStart(challenge)}
                                className={cn(
                                    "flex-[1.5] py-4 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all",
                                    !hasActiveChallenge 
                                        ? "bg-main text-white hover:bg-main-600 shadow-lg shadow-main/20" 
                                        : "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-white/5"
                                )}
                            >
                                <span className="flex items-center justify-center gap-1.5">Start <Play size={10} fill="currentColor" /></span>
                            </Button>
                        </>
                    )}
                </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
