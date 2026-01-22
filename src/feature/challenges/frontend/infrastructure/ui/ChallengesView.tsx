import { cn } from "assets/lib/utils";
import MainContainer from "components/MainContainer";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { selectCurrentUserStats,selectUserAuth } from "feature/user/store/userSlice";
import { Play,Trophy } from "lucide-react";
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

  const handleBack = () => {
    if (selectedChallenge) {
      setSelectedChallenge(null);
    } else {
      router.push("/timer");
    }
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
        <ChallengeHeader onBack={handleBack} />

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg w-fit mb-12">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-lg text-[10px] font-bold tracking-wide transition-all",
                  isActive 
                    ? "bg-zinc-800 text-white shadow-lg" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                )}
              >
                <Icon size={14} className={isActive ? "text-main" : ""} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-16">
          {activeTab === 'ACTIVE' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                <div className="text-center py-20 bg-zinc-950/30 rounded-2xl flex flex-col items-center">
                  <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 text-zinc-700">
                    <Trophy size={32} strokeWidth={1} />
                  </div>
                  <h3 className="text-xl font-black text-white italic mb-2">No active challenges</h3>
                  <p className="text-zinc-500 text-sm mb-8">Pick a challenge to start your daily practice routine.</p>
                  <button 
                    onClick={() => setActiveTab('PROGRESS')}
                    className="px-8 py-3 bg-main text-black rounded-lg font-bold text-[10px] tracking-wide hover:scale-105 transition-transform"
                  >
                    Browse Catalog
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

