import { Info } from "lucide-react";
import MainContainer from "components/MainContainer";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { ChallengeHeader } from "./ChallengeHeader";
import { ActiveChallengeBanner } from "./ActiveChallengeBanner";
import { ChallengeMap } from "./ChallengeMap";
import { useChallenges } from "../../hooks/useChallenges";
import { useState, useEffect } from "react";
import { Challenge } from "../../../backend/domain/models/Challenge";
import { useRouter } from "next/router";
import { useAppSelector } from "store/hooks";
import { selectUserAuth, selectCurrentUserStats } from "feature/user/store/userSlice";

export const ChallengesView = () => {
  const router = useRouter();
  const userAuth = useAppSelector(selectUserAuth);
  const userStats = useAppSelector(selectCurrentUserStats);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  const { 
    allChallenges, 
    activeChallenges, 
    completedChallenges, 
    handleStart, 
    handleAbandon,
    handleReset
  } = useChallenges();

  const userSkills = userStats?.skills;

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

  return (
    <MainContainer>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <ChallengeHeader onBack={handleBack} />

        <div className="p-4 rounded-lg bg-blue-500/5 flex items-start gap-3 mb-10">
          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            <span className="text-blue-400 font-bold uppercase tracking-wider block mb-1">Concept Mode</span>
            These challenges focus on specific guitar techniques and theoretical concepts. 
            Choose or create exercises that best fit the challenge goals.
          </p>
        </div>

        {activeChallengesData.map(({ data, ...ac }) => data && (
          <ActiveChallengeBanner 
            key={ac.challengeId}
            activeChallenge={ac}
            challengeData={data}
            onStart={onPractice}
            onAbandon={handleAbandon}
          />
        ))}

        <ChallengeMap 
          challengesByCategory={challengesByCategory}
          userSkills={userSkills}
          completedChallenges={completedChallenges}
          activeChallenges={activeChallenges}
          onPractice={onPractice}
          onAdd={onAdd}
          onStart={onStartNew}
          onReset={handleReset}
        />
      </div>
    </MainContainer>
  );
};
