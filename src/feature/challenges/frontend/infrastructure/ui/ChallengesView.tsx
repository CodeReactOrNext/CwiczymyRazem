import { cn } from "assets/lib/utils";
import MainContainer from "components/MainContainer";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { selectCurrentUserStats,selectUserAuth } from "feature/user/store/userSlice";
import { ChevronRight, Play, Trophy, Zap } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect,useState } from "react";
import { useAppSelector } from "store/hooks";

import type { Challenge } from "../../../backend/domain/models/Challenge";
import { useChallenges } from "../../hooks/useChallenges";
import { ActiveChallengeBanner } from "./ActiveChallengeBanner";
import { ChallengeHeader } from "./ChallengeHeader";
import { ChallengeMap } from "./ChallengeMap";
import { ChallengeRPGMap } from "./ChallengeRPGMap";

export const ChallengesView = () => {
  const router = useRouter();
  const userStats = useAppSelector(selectCurrentUserStats);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PROGRESS' | 'EXPLORE'>('ACTIVE');

  const { 
    allChallenges, 
    activeChallenges, 
    completedChallenges, 
    handleStart, 
    handleAbandon,
    handleReset
  } = useChallenges();

  const userSkills = userStats?.skills;

  const hasActiveChallenge = activeChallenges.length > 0;

  useEffect(() => {
    if (router.query.start) {
        const challengeId = router.query.start as string;
        const challengeToStart = (allChallenges as Challenge[]).find(c => c.id === challengeId);
        if (challengeToStart) {
            setSelectedChallenge(challengeToStart);
        }
    }
  }, [router.query.start, allChallenges]);

  const activeChallengesData = activeChallenges.map(ac => ({
    ...ac,
    data: (allChallenges as Challenge[]).find(c => c.id === ac.challengeId)
  })).filter(ac => ac.data);

  const challengesByCategory = (allChallenges as Challenge[]).reduce((acc, challenge) => {
    const category = challenge.category;
    if (!acc[category]) acc[category] = {};
    const skillId = challenge.requiredSkillId;
    if (!acc[category][skillId]) acc[category][skillId] = [];
    acc[category][skillId].push(challenge);
    return acc;
  }, {} as Record<string, Record<string, Challenge[]>>);

  const handleFinish = () => {
    setIsFinishing(true);
    router.push("/report");
  };


  const onPractice = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
  };

  const onAdd = async (challenge: Challenge) => {
    await handleStart(challenge);
  };

  const onStartNew = async (challenge: Challenge) => {
    await handleStart(challenge);
    setSelectedChallenge(challenge);
  };

  if (selectedChallenge) {
    return (
      <MainContainer>
        <PracticeSession 
          plan={selectedChallenge as any} 
          onFinish={handleFinish} 
          isFinishing={isFinishing} 
        />
      </MainContainer>
    );
  }

  const _recommendedStarters = (allChallenges as Challenge[])
    .filter(c => c.requiredLevel <= 1 && !completedChallenges.includes(c.id))
    .slice(0, 3);

  const tabs = [
    { id: 'ACTIVE', label: 'Active', icon: Play },
    { id: 'PROGRESS', label: 'Progress', icon: Trophy },
  ] as const;

  return (
    <MainContainer>
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <ChallengeHeader />

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-[#0a0a0a] p-1.5 rounded-xl w-fit mb-16 border border-zinc-900 shadow-2xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 px-8 py-3 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                  isActive 
                    ? "bg-white text-black shadow-[0_10px_20px_-5px_rgba(255,255,255,0.2)]" 
                    : "text-zinc-500 hover:text-white hover:bg-zinc-800/50"
                )}
              >
                <Icon size={14} strokeWidth={isActive ? 3 : 2} className={cn("transition-colors", isActive ? "text-black" : "text-zinc-600")} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-16">
          {activeTab === 'ACTIVE' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
              {hasActiveChallenge ? (
                <div className="space-y-6">
                  {activeChallengesData.map(({ data, ...ac }) => data && (
                    <ActiveChallengeBanner 
                      key={ac.challengeId}
                      activeChallenge={ac}
                      challengeData={data}
                      onStart={onPractice}
                      onAbandon={handleAbandon}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-10 bg-[#0a0a0a] border border-zinc-900 rounded-lg flex flex-col items-center relative overflow-hidden">
                  <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mb-4 text-zinc-600 relative z-10">
                    <Trophy size={22} strokeWidth={1.5} />
                  </div>
                  <div className="relative z-10 mb-5 text-center">
                    <h3 className="text-lg font-bold text-white mb-1">No Active Journeys</h3>
                    <p className="text-zinc-600 text-xs max-w-sm mx-auto">Pick a challenge below to start your streak.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('PROGRESS')}
                    className="relative z-10 px-6 h-9 bg-white text-black rounded-lg font-semibold text-xs hover:bg-zinc-100 transition-all flex items-center gap-2"
                  >
                    Explore Challenges
                    <ChevronRight size={14} strokeWidth={2.5} />
                  </button>
                </div>
              )}

              {/* Quick Recommendations even if has active ones, or only if few? */}
              <ChallengeMap 
                challengesByCategory={challengesByCategory}
                userSkills={userSkills}
                completedChallenges={completedChallenges}
                activeChallenges={activeChallenges}
                onPractice={onPractice}
                onAdd={onAdd}
                onStart={onStartNew}
                onReset={handleReset}
                isExpanded={false}
              />
            </div>
          )}

          {activeTab === 'PROGRESS' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ChallengeRPGMap 
                challengesByCategory={challengesByCategory}
                completedChallenges={completedChallenges}
                activeChallenges={activeChallenges}
                userSkills={userSkills?.unlockedSkills}
                onPractice={onPractice}
                onAdd={onAdd}
                onStart={onStartNew}
              />
            </div>
          )}

        </div>
      </div>
    </MainContainer>
  );
};

