import { guitarSkills } from "feature/skills/data/guitarSkills";
import { Lock,Trophy } from "lucide-react";

import type { Challenge } from "../../../backend/domain/models/Challenge";
import { ChallengeCard } from "./ChallengeCard";

interface ChallengeMapProps {
  challengesByCategory: Record<string, Record<string, Challenge[]>>;
  userSkills: any;
  completedChallenges: string[];
  activeChallenges: any[];
  onPractice: (c: Challenge) => void;
  onAdd: (c: Challenge) => void;
  onStart: (c: Challenge) => void;
  onReset?: (challengeId: string) => void;
  isExpanded?: boolean;
}

export const ChallengeMap = ({
  challengesByCategory,
  userSkills,
  completedChallenges,
  activeChallenges,
  onPractice,
  onAdd,
  onStart,
  onReset,
  isExpanded = true
}: ChallengeMapProps) => {
  const formatSkillName = (skillId: string) => {
    return skillId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
        const next = remaining.splice(0, 1)[0];
        sorted.push(next);
        visited.add(next.id);
      }
    }
    return sorted;
  };

  const categories = Object.keys(challengesByCategory);

  const allAvailableChallenges = Object.values(challengesByCategory)
    .flatMap(skills => Object.values(skills))
    .flat()
    .filter(c => {
      const currentLevel = userSkills?.unlockedSkills[c.requiredSkillId] || 0;
      const isDependencyMet = !c.dependsOn || completedChallenges.includes(c.dependsOn);
      const isUnlocked = currentLevel >= c.requiredLevel && isDependencyMet;
      const isAlreadyCompleted = completedChallenges.includes(c.id);
      const isActive = activeChallenges.some(ac => ac.challengeId === c.id);
      return isUnlocked && !isAlreadyCompleted && !isActive;
    })
    .slice(0, 3);

  if (!isExpanded) {
    return (
      <div className="space-y-8 relative">
        <div className="flex flex-col gap-1 mb-6 px-4">
            <h2 className="text-xl font-black text-white italic tracking-wide flex items-center gap-2">
              <Trophy className="text-main" size={18} />
              Recommended 
            </h2>
            <p className="text-zinc-500 text-xs font-bold tracking-wide">Ready to start immediately</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
          {allAvailableChallenges.map(challenge => (
             <ChallengeCard
                key={challenge.id}
                challenge={challenge as any}
                isUnlocked={true}
                currentLevel={userSkills?.unlockedSkills[challenge.requiredSkillId] || 0}
                onPractice={onPractice}
                onAdd={onAdd}
                onStart={onStart}
                hasActiveChallenge={activeChallenges.length >= 3}
                isActive={false}
                isTodayDone={false}
                isDependencyMet={true}
                isCompleted={false}
                onReset={onReset}
              />
          ))}
          {allAvailableChallenges.length === 0 && (
            <div className="col-span-full h-40 rounded-lg bg-zinc-900/50 flex flex-col items-center justify-center gap-3">
                <Lock className="text-zinc-800" size={32} />
                <span className="text-zinc-600 text-[10px] font-bold tracking-wide">All current paths mastered</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-32">
      {/* Category Navigation (Sticky) */}
      <div className="sticky top-6 z-30 bg-zinc-900 p-1 flex items-center gap-1 max-w-fit mx-auto shadow-2xl rounded-lg">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => document.getElementById(`category-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="px-6 py-2 rounded-lg text-[10px] font-bold tracking-wide text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
          >
            {cat}
          </button>
        ))}
      </div>

      {Object.entries(challengesByCategory).map(([category, skills]) => (
        <div key={category} id={`category-${category}`} className="relative scroll-mt-24 space-y-16">
          <div className="flex flex-col gap-2">
            <h2 className="text-4xl font-black text-white italic tracking-tight">
              {category}
            </h2>
            <div className="h-1 w-12 bg-main" />
          </div>

          <div className="grid grid-cols-1 gap-24">
            {Object.entries(skills).map(([skillId, unsortedChallenges]) => {
              const sorted = getSortedChallengesInSkill(unsortedChallenges);
              const skillData = guitarSkills.find(s => s.id === skillId);
              const SkillIcon = skillData?.icon;

              return (
                <div key={skillId} className="space-y-10 group/skill">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center text-main">
                       {SkillIcon ? <SkillIcon size={20} /> : <Trophy size={20} />}
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-base font-black text-white italic tracking-wide leading-none mb-1">
                        {formatSkillName(skillId)}
                      </h3>
                      <span className="text-[9px] font-bold text-zinc-600 tracking-wide leading-none">
                        Path Progression
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sorted.map((challenge) => {
                      const currentLevel = userSkills?.unlockedSkills[challenge.requiredSkillId] || 0;
                      const isAlreadyCompleted = completedChallenges.includes(challenge.id);
                      const isDependencyMet = !challenge.dependsOn || completedChallenges.includes(challenge.dependsOn);
                      const isUnlocked = currentLevel >= challenge.requiredLevel && isDependencyMet;
                      const activeChallenge = activeChallenges.find(ac => ac.challengeId === challenge.id);
                      const isActive = !!activeChallenge;
                      const today = new Date().toISOString().split('T')[0];
                      const isTodayDone = activeChallenge?.lastCompletedDate === today;

                      return (
                        <div key={challenge.id} className="relative h-full">
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

