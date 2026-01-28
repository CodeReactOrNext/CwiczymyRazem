import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { Award, Calendar, CheckCircle2, Flame, Lock, Sparkles, Target } from "lucide-react";

import type { Challenge } from "../../../backend/domain/models/Challenge";

interface ChallengeCardProps {
  challenge: Challenge;
  isUnlocked: boolean;
  currentLevel: number;
  onPractice: (challenge: Challenge) => void;
  onStart: (challenge: Challenge) => void;
  hasActiveChallenge?: boolean;
  isActive?: boolean;
  isTodayDone?: boolean;
  isCompleted?: boolean;
  onReset?: (challengeId: string) => void;
}

export const ChallengeCard = ({
  challenge,
  isUnlocked,
  currentLevel,
  onPractice,
  onStart,
  hasActiveChallenge = false,
  isActive = false,
  isTodayDone = false,
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
        "relative flex flex-col h-full rounded-lg transition-all duration-300 group overflow-hidden border border-zinc-900",
        isCompleted
          ? "opacity-60 bg-[#0a0a0a]"
          : isActive
            ? "bg-[#0c0c0c] border-white/10 shadow-lg"
            : isUnlocked 
              ? "bg-[#0f0f0f] hover:bg-[#121212]"
              : "bg-[#080808] opacity-50 grayscale"
      )}
    >
      {/* Visual Decoration for Unlocked Cards */}
      {isUnlocked && !isCompleted && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] blur-2xl rounded-full -mr-12 -mt-12 pointer-events-none group-hover:bg-white/[0.04] transition-colors" />
      )}

      <div className="flex flex-col h-full p-6 relative z-10">
        <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center border transition-colors",
                isActive ? "bg-white border-white text-black" : "bg-zinc-900 border-zinc-800 text-zinc-500"
              )}>
                {SkillIcon ? <SkillIcon size={18} strokeWidth={1.5} /> : <Target size={18} />}
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest leading-none mb-1">Theme</span>
                <span className={cn(
                   "text-[9px] font-bold uppercase tracking-wider leading-none",
                   isActive ? "text-white" : "text-zinc-500"
                )}>
                  {challenge.category}
                </span>
              </div>
            </div>

            <Badge 
              className="font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm border"
              style={{
                backgroundColor: `${tier.color}05`,
                borderColor: `${tier.color}20`,
                color: tier.color,
              }}
            >
              Tier {tier.tier}
            </Badge>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            {!isUnlocked && <Lock size={12} className="text-zinc-700" />}
            <h3 className="font-bold text-white text-lg tracking-tight leading-tight transition-colors">
              {challenge.title}
            </h3>
          </div>
          <p className="text-zinc-600 text-[11px] font-medium leading-relaxed line-clamp-2">
            {challenge.description}
          </p>
        </div>

        <div className="mt-auto space-y-5">
          {!isUnlocked ? (
            <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest leading-none">Requirement</span>
                        <span className="text-[10px] font-bold text-zinc-500">{formatSkillName(challenge.requiredSkillId)}</span>
                    </div>
                    <div className={cn(
                        "px-2 py-1 rounded-sm border text-[10px] font-bold uppercase tracking-wider",
                        currentLevel >= challenge.requiredLevel ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" : "border-red-500/20 bg-red-500/10 text-red-400"
                    )}>
                        Lvl {challenge.requiredLevel}
                    </div>
                </div>
            </div>
          ) : (
            <>
              {/* Reward Mini Panel */}
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-zinc-950 border border-zinc-900">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Reward</span>
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={11} className="text-zinc-500" />
                    <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-tight">{challenge.rewardDescription} XP</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Duration</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={11} className="text-zinc-500" />
                    <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-tight">{challenge.streakDays} Days</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                  {isActive ? (
                      <Button
                          size="lg"
                          onClick={() => onPractice(challenge)}
                          disabled={isTodayDone}
                          className={cn(
                            "w-full h-11 font-bold tracking-widest text-[10px] uppercase rounded-lg transition-all",
                            isTodayDone ? "bg-zinc-900 text-zinc-600 border border-zinc-800" : "bg-white text-black hover:bg-zinc-100 shadow-lg"
                          )}
                      >
                          {isTodayDone ? "Goal reached" : "Resume"}
                      </Button>
                  ) : isCompleted ? (
                      <Button 
                          onClick={() => onReset?.(challenge.id)}
                          size="lg"
                          className="w-full h-11 font-bold tracking-widest text-[10px] uppercase bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded-lg"
                      >
                          Mastery Redo
                      </Button>
                  ) : hasActiveChallenge ? (
                      <div className="w-full h-11 flex items-center justify-center rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                          <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">Limit reached</span>
                      </div>
                  ) : (
                      <Button
                          size="lg"
                          onClick={() => onStart(challenge)}
                          className="w-full h-11 font-bold tracking-widest text-[10px] uppercase bg-white text-black hover:bg-zinc-100 rounded-lg shadow-lg transition-all"
                      >
                          Start Journey
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

