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
      <div className="space-y-12 relative">
        <div className="flex flex-col gap-2 px-4">
            <h2 className="text-xl font-bold text-white tracking-tight">Recommendation</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          {allAvailableChallenges.map(challenge => (
             <ChallengeCard
                key={challenge.id}
                challenge={challenge as any}
                isUnlocked={true}
                currentLevel={userSkills?.unlockedSkills[challenge.requiredSkillId] || 0}
                onPractice={onPractice}
                onStart={onStart}
                hasActiveChallenge={activeChallenges.length >= 3}
                isActive={false}
                isTodayDone={false}
                isCompleted={false}
                onReset={onReset}
              />
          ))}
          {allAvailableChallenges.length === 0 && (
            <div className="col-span-full h-48 rounded-[2rem] bg-[#0a0a0a] border border-zinc-900 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-700">
                  <Lock size={24} strokeWidth={1.5} />
                </div>
                <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">All current paths mastered</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-32">
      {/* Category Navigation (Sticky) */}
      <div className="sticky top-8 z-30 bg-black/80 backdrop-blur-xl border border-zinc-900 p-1.5 flex items-center gap-2 max-w-fit mx-auto shadow-2xl rounded-2xl">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => document.getElementById(`category-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
          >
            {cat}
          </button>
        ))}
      </div>

      {Object.entries(challengesByCategory).map(([category, skills]) => (
        <div key={category} id={`category-${category}`} className="relative scroll-mt-32 space-y-16">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Mastery Track</span>
            <h2 className="text-5xl font-black text-white uppercase tracking-tighter">
              {category}
            </h2>
            <div className="h-2 w-20 bg-white" />
          </div>

          <div className="grid grid-cols-1 gap-32">
            {Object.entries(skills).map(([skillId, unsortedChallenges]) => {
              const sorted = getSortedChallengesInSkill(unsortedChallenges);
              const skillData = guitarSkills.find(s => s.id === skillId);
              const SkillIcon = skillData?.icon;

              return (
                <div key={skillId} className="space-y-12 group/skill">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#0a0a0a] border border-zinc-900 flex items-center justify-center text-white shadow-xl">
                       {SkillIcon ? <SkillIcon size={28} strokeWidth={1.5} /> : <Trophy size={28} strokeWidth={1.5} />}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none">Technique Path</span>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">
                        {formatSkillName(skillId)}
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                            onStart={onStart}
                            hasActiveChallenge={activeChallenges.length >= 3 && !isActive}
                            isActive={isActive}
                            isTodayDone={isTodayDone}
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

