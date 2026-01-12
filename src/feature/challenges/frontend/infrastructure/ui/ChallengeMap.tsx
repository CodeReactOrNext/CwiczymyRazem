import { Challenge } from "../../../backend/domain/models/Challenge";
import { ChallengeCard } from "./ChallengeCard";
import { cn } from "assets/lib/utils";

interface ChallengeMapProps {
  challengesByCategory: Record<string, Record<string, Challenge[]>>;
  userSkills: any;
  completedChallenges: string[];
  activeChallenges: any[];
  onPractice: (c: Challenge) => void;
  onAdd: (c: Challenge) => void;
  onStart: (c: Challenge) => void;
  onReset?: (challengeId: string) => void;
}

export const ChallengeMap = ({
  challengesByCategory,
  userSkills,
  completedChallenges,
  activeChallenges,
  onPractice,
  onAdd,
  onStart,
  onReset
}: ChallengeMapProps) => {
  const formatSkillName = (skillId: string) => {
    return skillId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const sortedSkills = (categoryDict: Record<string, Challenge[]>) => {
    return Object.entries(categoryDict).sort((a, b) => b[1].length - a[1].length);
  };

  const getSortedChallengesInSkill = (challenges: Challenge[]) => {
    const sorted: Challenge[] = [];
    const remaining = [...challenges];
    const visited = new Set<string>();
    
    while (remaining.length > 0) {
      const nextIndex = remaining.findIndex(c => !c.dependsOn || visited.has(c.dependsOn));
      if (nextIndex !== -1) {
        const next = remaining.splice(nextIndex, 1)[0];
        sorted.push(next);
        visited.add(next.id);
      } else {
        sorted.push(...remaining.splice(0));
      }
    }
    return sorted;
  };

  return (
    <div className="space-y-16">
      {Object.entries(challengesByCategory).map(([category, skills]) => (
        <div key={category} className="relative">
          <div className="flex items-baseline gap-4 mb-8">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter opacity-20">
              {category}
            </h2>
            <div className="h-[2px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>

          <div className="absolute inset-0 top-16 -z-10 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

          <div className="grid grid-cols-1 gap-12">
            {sortedSkills(skills).map(([skillId, unsortedChallenges]) => {
              const sorted = getSortedChallengesInSkill(unsortedChallenges);
              
              return (
                <div key={skillId} className="relative pl-12">
                  <div className="absolute left-6 top-[-24px] bottom-0 w-[2px] bg-gradient-to-b from-zinc-800 to-transparent" />
                  <div className="absolute left-5 top-4 w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center">
                     <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                  </div>

                  <div className="mb-4 flex items-center gap-4">
                    <div className="px-3 py-1 rounded bg-zinc-800 relative">
                       <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                         {formatSkillName(skillId)}
                       </h3>
                    </div>
                    <div className="h-[1px] flex-1 bg-zinc-900" />
                  </div>

                  <div className="relative flex flex-col md:flex-row gap-8 overflow-x-auto pb-8 scrollbar-hide snap-x px-4">
                    {sorted.map((challenge, index) => {
                      const currentLevel = userSkills?.unlockedSkills[challenge.requiredSkillId] || 0;
                      let isDependencyMet = true;
                      const isAlreadyCompleted = completedChallenges.includes(challenge.id);

                      if (challenge.dependsOn && !completedChallenges.includes(challenge.dependsOn)) {
                        isDependencyMet = false;
                      }

                      const isUnlocked = currentLevel >= challenge.requiredLevel && isDependencyMet;
                      const activeChallenge = activeChallenges.find(ac => ac.challengeId === challenge.id);
                      const isActive = !!activeChallenge;
                      const today = new Date().toISOString().split('T')[0];
                      const isTodayDone = activeChallenge?.lastCompletedDate === today;

                      return (
                        <div key={challenge.id} className="min-w-[260px] max-w-[300px] flex-1 snap-start relative group">
                          {index < sorted.length - 1 && (
                            <div className="hidden md:flex absolute top-12 -right-8 w-8 items-center justify-center z-0">
                              <div className={cn(
                                "h-[2px] w-full transition-all duration-700",
                                isUnlocked 
                                  ? (isAlreadyCompleted ? "bg-main/40" : "bg-main shadow-[0_0_8px_rgba(var(--main-rgb),0.4)]") 
                                  : "bg-zinc-800"
                              )} />
                              {!isAlreadyCompleted && isUnlocked && (
                                <div className="absolute w-2 h-2 rounded-full bg-main animate-ping opacity-20" />
                              )}
                              <div className={cn(
                                "absolute w-2 h-2 rounded-full transition-all duration-500",
                                isUnlocked ? "bg-main" : "bg-zinc-800"
                              )} />
                            </div>
                          )}
                          <ChallengeCard
                            challenge={challenge as any}
                            isUnlocked={isUnlocked}
                            currentLevel={currentLevel}
                            onPractice={onPractice}
                            onAdd={onAdd}
                            onStart={onStart}
                            hasActiveChallenge={activeChallenges.length >= 3 && !isActive}
                            isActive={isActive}
                            isTodayDone={isTodayDone}
                            isDependencyMet={isDependencyMet}
                            isCompleted={isAlreadyCompleted}
                            onReset={onReset}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
