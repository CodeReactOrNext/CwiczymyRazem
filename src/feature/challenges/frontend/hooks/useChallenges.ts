import { useAppSelector, useAppDispatch } from "store/hooks";
import { selectUserAuth, selectCurrentUserStats } from "feature/user/store/userSlice";
import { challengeRepository } from "../../index";
import { ChallengeUseCases } from "../../backend/application/ChallengeUseCases";
import { useEffect, useState, useMemo } from "react";
import { Challenge, ActiveChallenge } from "../../backend/domain/models/Challenge";
import { toast } from "sonner";

const useCases = new ChallengeUseCases(challengeRepository);

export const useChallenges = () => {
  const userAuth = useAppSelector(selectUserAuth);
  const userStats = useAppSelector(selectCurrentUserStats);
  const [allChallenges, setAllChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);

  const userId = userAuth?.uid;

  useEffect(() => {
    useCases.getAllChallenges().then(setAllChallenges);
  }, []);

  const activeChallenges = userStats?.activeChallenges || [];
  const completedChallenges = userStats?.completedChallenges || [];

  const handleStart = async (challenge: Challenge) => {
    if (!userId) return;
    setLoading(true);
    try {
      await useCases.startChallenge(userId, challenge);
      toast.success("Challenge started!");
      // Progress is managed via Redux update usually, but here we would need to refresh or trust socket/firebase sync
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAbandon = async (challengeId: string) => {
    if (!userId) return;
    if (!confirm("Are you sure you want to quit?")) return;
    setLoading(true);
    try {
      await useCases.abandonChallenge(userId, challengeId);
      toast.success("Challenge abandoned.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    allChallenges,
    activeChallenges,
    completedChallenges,
    handleStart,
    handleAbandon,
    loading
  };
};
