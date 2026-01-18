import { Button } from "assets/components/ui/button";
import { Badge } from "assets/components/ui/badge";
import { cn } from "assets/lib/utils";
import { Challenge } from "../../../backend/domain/models/Challenge";
import { Lock, Calendar, CheckCircle2, Play, Plus, Target, Award, ShieldAlert, Sparkles, Flame, Trophy } from "lucide-react";
import { getSongTier } from "feature/songs/utils/getSongTier";
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
  onReset?: (challengeId: string) => void;
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
  onReset,
}: ChallengeCardProps) => {
  const formatSkillName = (skillId: string) => {
    return skillId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const skillData = guitarSkills.find(s => s.id === challenge.requiredSkillId);
  const SkillIcon = skillData?.icon;

  const getBenefit = (category: string) => {
    switch (category.toLowerCase()) {
      case 'technique': return 'Precision & Speed';
      case 'theory': return 'Concept Mastery';
      case 'hearing': return 'Ear-to-Hand';
      case 'creativity': return 'Melodic Flow';
      default: return 'Core Skill';
    }
  };

  const tierMap: Record<string, 'S' | 'A' | 'B' | 'C' | 'D'> = {
    extreme: 'S',
    high: 'A',
    medium: 'B',
    low: 'C',
  };

  const tier = getSongTier(tierMap[challenge.intensity] || 'D');

  return (
    <div
      className={cn(
        "relative flex flex-col h-full rounded-lg transition-all group overflow-hidden bg-zinc-900",
        isCompleted
          ? "opacity-60 bg-zinc-950"
          : isActive
            ? "ring-2 ring-main shadow-[0_0_20px_rgba(var(--main-rgb),0.1)]"
            : isUnlocked 
              ? "hover:bg-zinc-800/80 shadow-xl"
              : "opacity-40 grayscale-[0.8]"
      )}
    >
      {isActive && (
        <div className="absolute top-0 right-0 p-3">
            <Sparkles size={14} className="text-main" />
        </div>
      )}

      {isCompleted && (
        <div className="absolute top-3 right-3">
            <CheckCircle2 size={14} className="text-main/40" />
        </div>
      )}
      
      <div className="flex flex-col h-full p-6">
        <div className="flex items-center justify-between mb-4">
            {!isUnlocked ? (
              <div className="flex items-center gap-1 text-[10px] font-bold tracking-wide text-zinc-600">
                  <Lock size={10} />
                  <span>Locked</span>
              </div>
            ) : isActive ? (
                <div className="flex items-center gap-1.5 text-main text-[10px] font-bold tracking-wide">
                    <Flame size={12} className="fill-main" />
                    Focus
                </div>
            ) : (
                <div className="flex items-center gap-1 text-[10px] font-bold tracking-wide text-zinc-500">
                    <Calendar size={12} className="opacity-50" />
                    {challenge.streakDays}d
                </div>
            )}

            <Badge 
              variant="outline"
              className="font-black text-[9px] border-none px-2"
              style={{
                backgroundColor: `${tier.color}15`,
                color: tier.color,
              }}
            >
              Tier {tier.tier}
            </Badge>
        </div>

        <div className="mb-6">
          <h3 className={cn(
            "font-black text-white leading-tight mb-1",
            isUnlocked ? "text-lg" : "text-base"
          )}>
            {challenge.title}
          </h3>
          <p className="text-main text-[10px] font-bold tracking-wide mb-3 leading-none italic">
            {getBenefit(challenge.category)}
          </p>
          <p className={cn(
            "text-[12px] leading-relaxed line-clamp-3",
            isUnlocked ? "text-zinc-500 font-medium" : "text-zinc-600"
          )}>
            {challenge.description}
          </p>
        </div>

        <div className="mt-auto space-y-4">
          {!isUnlocked ? (
            <div className="p-4 rounded-lg bg-zinc-950/30">
                <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-zinc-600 font-bold tracking-tight">
                        <Lock size={12} />
                        <span>{formatSkillName(challenge.requiredSkillId)}</span>
                    </div>
                    <span className={cn(
                        "font-black px-2 py-0.5 rounded bg-zinc-900",
                        currentLevel >= challenge.requiredLevel ? "text-emerald-500" : "text-red-400"
                    )}>
                        Lvl {challenge.requiredLevel}
                    </span>
                </div>
            </div>
          ) : (
            <>
              {/* Reward Section */}
              <div className="p-4 rounded-lg bg-zinc-950/50 flex flex-col gap-3">
                <div className="flex items-center justify-between pb-1">
                   <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 tracking-wide uppercase">
                      <Award size={12} className="text-amber-500/50" />
                      <span>Unlock Reward</span>
                   </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-medium text-zinc-300 truncate">{challenge.rewardDescription || "Performance Mastery"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded text-[9px] font-black text-white">
                        <Sparkles size={10} className="text-amber-400" />
                        <span>XP</span>
                    </div>
                  </div>
                  {challenge.rewardSkillId && (
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                        <span className="text-[10px] font-bold text-zinc-500">
                          {formatSkillName(challenge.rewardSkillId)}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-400">+{challenge.rewardLevel}pts</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                  {isActive ? (
                      <Button
                          size="sm"
                          onClick={() => onPractice(challenge)}
                          disabled={isTodayDone}
                          className={cn(
                            "flex-1 h-10 font-bold tracking-wide text-[10px] rounded-lg",
                            isTodayDone ? "bg-zinc-800 text-zinc-500" : "bg-main text-black"
                          )}
                      >
                          {isTodayDone ? "Daily Goal Done" : "Continue"}
                      </Button>
                  ) : isCompleted ? (
                      <Button 
                          onClick={() => onReset?.(challenge.id)}
                          size="sm" 
                          className="w-full h-10 font-bold text-[10px] tracking-wide bg-zinc-800 text-zinc-400 hover:text-white rounded-lg"
                      >
                          Mastered (Redo)
                      </Button>
                  ) : hasActiveChallenge ? (
                      <div className="w-full h-10 flex items-center justify-center rounded-lg bg-zinc-950">
                          <span className="text-[10px] font-bold text-zinc-700 tracking-wide">Focus Limit</span>
                      </div>
                  ) : (
                      <Button
                          size="sm"
                          onClick={() => onStart(challenge)}
                          className="w-full h-10 font-bold tracking-wide text-[10px] bg-white text-black hover:bg-main rounded-lg"
                      >
                          Start Challenge
                      </Button>
                  )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

