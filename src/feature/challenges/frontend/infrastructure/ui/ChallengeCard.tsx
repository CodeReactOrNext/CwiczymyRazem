import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { Challenge } from "../../../backend/domain/models/Challenge";
import { Lock, Calendar, CheckCircle2, Play, Plus, Target, Award, ShieldAlert, Sparkles, Flame } from "lucide-react";
import { guitarSkills } from "feature/skills/data/guitarSkills";

interface ChallengeCardProps {
  challenge: Challenge;
  isUnlocked: boolean;
  currentLevel: number;
  onPractice: (challenge: Challenge) => void;
  onAdd: (challenge: Challenge) => void;
  onStart: (challenge: Challenge) => void;
  hasActiveChallenge?: boolean;
  isActive?: boolean;
  isTodayDone?: boolean;
  isDependencyMet?: boolean;
  isCompleted?: boolean;
}

export const ChallengeCard = ({
  challenge,
  isUnlocked,
  currentLevel,
  onPractice,
  onAdd,
  onStart,
  hasActiveChallenge = false,
  isActive = false,
  isTodayDone = false,
  isDependencyMet = true,
  isCompleted = false,
}: ChallengeCardProps) => {
  const formatSkillName = (skillId: string) => {
    return skillId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const skillData = guitarSkills.find(s => s.id === challenge.requiredSkillId);
  const SkillIcon = skillData?.icon;

  return (
    <div
      className={cn(
        "relative flex flex-col h-full rounded-lg transition-all group overflow-hidden",
        isCompleted
          ? "bg-zinc-900/50"
          : isUnlocked 
            ? "bg-zinc-900 shadow-xl shadow-black/20"
            : "bg-zinc-900/30 grayscale-[0.5]"
      )}
    >
      {isUnlocked && !isCompleted && (
        <div className={cn(
            "absolute left-0 top-0 bottom-0 w-[2px] transition-all",
            isActive ? "bg-main shadow-[0_0_8px_rgba(var(--main-rgb),0.5)]" : "bg-zinc-700"
        )} />
      )}

      {isCompleted && (
        <div className="absolute top-3 right-3">
            <CheckCircle2 size={16} className="text-main/60" />
        </div>
      )}
      
      <div className="flex flex-col h-full p-5">
        <div className="flex items-center justify-between mb-4">
            {!isUnlocked ? (
              <div className="flex items-center gap-1.5 text-red-400/80">
                  <Lock size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-tight">Locked</span>
              </div>
            ) : (
                <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold uppercase tracking-tight">
                    <Calendar size={12} className="opacity-70" />
                    {challenge.streakDays} Days
                </div>
            )}

            <div className="flex items-center gap-0.5 ml-auto mr-3">
              {[...Array(4)].map((_, i) => {
                const levels: Record<string, number> = { low: 1, medium: 2, high: 3, extreme: 4 };
                const challengeLevel = levels[challenge.intensity] || 1;
                const isActive = i < challengeLevel;
                return (
                  <Flame 
                    key={i} 
                    size={11}
                    className={cn(
                      "transition-colors",
                      isActive 
                        ? (challenge.intensity === 'extreme' ? "text-red-500 fill-red-500" : "text-main fill-main") 
                        : "text-zinc-800"
                    )} 
                  />
                );
              })}
            </div>

            {isCompleted && (
               <span className="text-[9px] font-black text-main/50 uppercase">Mastered</span>
            )}
        </div>

        <div className="mb-5">
          <h3 className={cn(
            "font-black text-white leading-tight mb-1.5",
            isUnlocked ? "text-[17px]" : "text-base opacity-40"
          )}>
            {challenge.title}
          </h3>
          <p className={cn(
            "text-[12px] leading-normal line-clamp-2 italic",
            isUnlocked ? "text-zinc-500" : "text-zinc-600 opacity-30"
          )}>
            {challenge.description}
          </p>
        </div>

        <div className="mt-auto space-y-4">
          {!isUnlocked ? (
            <div className="p-3 rounded bg-red-400/5 border border-red-400/10 space-y-2">
                <div className="flex items-center gap-2 text-[10px]">
                    <ShieldAlert size={12} className="text-red-400/60" />
                    <span className="text-zinc-400 uppercase font-black">Requirements</span>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-zinc-500 uppercase font-bold">{formatSkillName(challenge.requiredSkillId)}</span>
                        <span className={cn(
                            "font-black",
                            currentLevel >= challenge.requiredLevel ? "text-emerald-500" : "text-red-400"
                        )}>
                            Lvl {challenge.requiredLevel}
                        </span>
                    </div>
                    {challenge.dependsOn && (
                         <div className="flex items-center justify-between text-[10px]">
                            <span className="text-zinc-500 uppercase font-bold">Previous Step</span>
                            <span className={cn(
                                "font-black",
                                isDependencyMet ? "text-emerald-500" : "text-red-400"
                            )}>
                                {isDependencyMet ? "Done" : "Required"}
                            </span>
                        </div>
                    )}
                </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-[11px]">
                      <Target size={14} className="text-zinc-600 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-zinc-500 text-[9px] font-bold uppercase leading-none mb-0.5">Objective</span>
                        <span className="text-zinc-300 font-medium leading-tight">{challenge.shortGoal}</span>
                      </div>
                  </div>

                  <div className="relative p-3 rounded-lg bg-zinc-950 border border-white/5 overflow-hidden group/reward">
                      <div className="absolute top-0 right-0 p-2 opacity-5">
                         {SkillIcon && <SkillIcon className="w-12 h-12" />}
                      </div>
                      
                      <div className="relative flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-main/10 flex items-center justify-center text-main">
                             <Award size={20} />
                          </div>
                          <div className="flex flex-col">
                              <span className="text-zinc-500 text-[9px] font-black uppercase leading-none mb-1 flex items-center gap-1">
                                Reward
                              </span>
                              <div className="flex flex-col">
                                  <span className="text-white text-[12px] font-bold leading-tight uppercase italic">{challenge.rewardDescription} XP</span>
                                  {challenge.rewardSkillId && (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      {SkillIcon && <SkillIcon className="w-3 h-3 text-main" />}
                                      <span className="text-main text-[11px] font-black leading-none">
                                        +{challenge.rewardLevel} pts
                                      </span>
                                      <span className="text-zinc-500 text-[9px] font-bold uppercase">
                                        {formatSkillName(challenge.rewardSkillId)}
                                      </span>
                                    </div>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="flex gap-2 pt-2">
                  {isActive ? (
                      <Button
                          size="sm"
                          onClick={() => onPractice(challenge)}
                          disabled={isTodayDone}
                          className="flex-1 h-10 font-black uppercase tracking-wider text-[11px]"
                          variant={isTodayDone ? "secondary" : "default"}
                      >
                          {isTodayDone ? (
                              <span className="flex items-center gap-2">Done <CheckCircle2 size={14} /></span>
                          ) : (
                              <span className="flex items-center gap-2">Practice <Play size={14} fill="currentColor" /></span>
                          )}
                      </Button>
                  ) : isCompleted ? (
                      <Button disabled size="sm" variant="secondary" className="w-full h-10 font-black uppercase text-[11px] opacity-50">
                          Unlocked
                      </Button>
                  ) : hasActiveChallenge ? (
                      <div className="w-full h-10 flex items-center justify-center rounded bg-zinc-800/30">
                          <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-tight">Limit (3/3) Active</span>
                      </div>
                  ) : (
                      <>
                          <Button
                              size="sm"
                              onClick={() => onAdd(challenge)}
                              variant="secondary"
                              className="flex-1 h-10 font-black uppercase text-[11px]"
                          >
                              Add
                          </Button>
                          <Button
                              size="sm"
                              onClick={() => onStart(challenge)}
                              className="flex-1 h-10 font-black uppercase text-[11px]"
                          >
                              Start
                          </Button>
                      </>
                  )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
