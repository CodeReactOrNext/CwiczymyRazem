import { Challenge } from "../../../backend/domain/models/Challenge";
import { ChallengeCard } from "./ChallengeCard";
import { cn } from "assets/lib/utils";

interface ChallengeMapProps {
  challengesByCategory: Record<string, Record<string, Challenge[]>>;
  userSkills: any;
  completedChallenges: string[];
  activeChallenges: any[];
  handleStart: (c: Challenge) => void;
  handleAdd: (c: Challenge) => void;
}

export const ChallengeMap = ({
  challengesByCategory,
  userSkills,
  completedChallenges,
  activeChallenges,
  handleStart,
  handleAdd
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
                  <div className="absolute left-5 top-4 w-4 h-4 rounded-full border-2 border-zinc-800 bg-zinc-950 flex items-center justify-center">
                     <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                  </div>

                  <div className="mb-4 flex items-center gap-4">
                    <div className="px-3 py-1 rounded-full bg-zinc-800 border border-white/5 relative">
                       <h3 className="text-xs font-black text-zinc-300 uppercase tracking-[0.2em]">
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

                      return (
                        <div key={challenge.id} className="min-w-[200px] max-w-[240px] flex-1 snap-start relative group">
                          {index < sorted.length - 1 && (
                            <div className="hidden md:flex absolute top-12 -right-8 w-8 items-center justify-center z-0">
                              <div className={cn(
                                "h-[1px] w-full transition-all duration-500",
                                isUnlocked ? "bg-main/30 shadow-[0_0_8px_rgba(var(--main-rgb),0.2)]" : "bg-zinc-800/50"
                              )} />
                              <div className={cn(
                                "absolute w-1.5 h-1.5 rounded-full border transition-all duration-500",
                                isUnlocked ? "bg-main border-main shadow-[0_0_12px_rgba(var(--main-rgb),0.6)] scale-110" : "bg-zinc-900 border-zinc-800"
                              )} />
                            </div>
                          )}
                          <ChallengeCard
                            challenge={challenge as any}
                            isUnlocked={isUnlocked}
                            currentLevel={currentLevel}
                            onStart={handleStart}
                            onAdd={handleAdd}
                            hasActiveChallenge={activeChallenges.length >= 3 && !activeChallenges.some(ac => ac.challengeId === challenge.id)}
                            isActive={activeChallenges.some(ac => ac.challengeId === challenge.id)}
                            isDependencyMet={isDependencyMet}
                            isCompleted={isAlreadyCompleted}
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
