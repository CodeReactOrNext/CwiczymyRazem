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
import { getUserSkills } from "feature/skills/services/getUserSkills";
import { useAppSelector } from "store/hooks";
import { selectUserAuth } from "feature/user/store/userSlice";

export const ChallengesView = () => {
  const router = useRouter();
  const userAuth = useAppSelector(selectUserAuth);
  const [userSkills, setUserSkills] = useState<any>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  const { 
    allChallenges, 
    activeChallenges, 
    completedChallenges, 
    handleStart, 
    handleAbandon 
  } = useChallenges();

  useEffect(() => {
    if (userAuth) {
      getUserSkills(userAuth).then(setUserSkills);
    }
  }, [userAuth]);

  useEffect(() => {
    if (router.query.start) {
        const challengeId = router.query.start as string;
        const challengeToStart = allChallenges.find(c => c.id === challengeId);
        if (challengeToStart) {
            setSelectedChallenge(challengeToStart);
        }
    }
  }, [router.query.start, allChallenges]);

  const activeChallengesData = activeChallenges.map(ac => ({
    ...ac,
    data: allChallenges.find(c => c.id === ac.challengeId)
  })).filter(ac => ac.data);

  const challengesByCategory = allChallenges.reduce((acc, challenge) => {
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

        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3 mb-10">
          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            <span className="text-blue-400 font-bold uppercase tracking-wider block mb-1">Concept Mode</span>
            These challenges focus on specific guitar techniques and theoretical concepts. 
            <strong>You are responsible for choosing or creating specific exercises</strong> that fit the challenge goals.
          </p>
        </div>

        {activeChallengesData.map(({ data, ...ac }) => data && (
          <ActiveChallengeBanner 
            key={ac.challengeId}
            activeChallenge={ac}
            challengeData={data}
            onStart={handleStart}
            onAbandon={handleAbandon}
          />
        ))}

        <ChallengeMap 
          challengesByCategory={challengesByCategory}
          userSkills={userSkills}
          completedChallenges={completedChallenges}
          activeChallenges={activeChallenges}
          handleStart={handleStart}
          handleAdd={handleStart} // Simplified for now
        />
      </div>
    </MainContainer>
  );
};
