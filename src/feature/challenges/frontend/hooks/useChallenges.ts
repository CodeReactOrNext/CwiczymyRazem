import { useAppSelector, useAppDispatch } from "store/hooks";
import { selectUserAuth, selectCurrentUserStats } from "feature/user/store/userSlice";
import { challengeUseCases } from "../../index";
import { saveActiveChallenge } from "feature/user/store/userSlice.asyncThunk";
import { useEffect, useState } from "react";
import { Challenge } from "../../backend/domain/models/Challenge";
import { toast } from "sonner";

export const useChallenges = () => {
  const userAuth = useAppSelector(selectUserAuth);
  const userStats = useAppSelector(selectCurrentUserStats);
  const [allChallenges, setAllChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);

  const userId = userAuth

  const dispatch = useAppDispatch();

  useEffect(() => {
    challengeUseCases.getAllChallenges().then(setAllChallenges);
  }, []);

  const activeChallenges = userStats?.activeChallenges || [];
  const completedChallenges = userStats?.completedChallenges || [];

  const handleStart = async (challenge: Challenge) => {
    if (!userId) return;
    setLoading(true);
    try {
      await dispatch(saveActiveChallenge({ challenge: { challengeId: challenge.id } as any })).unwrap();
      toast.success("Challenge started!");
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
      await dispatch(saveActiveChallenge({ challenge: null, quitId: challengeId })).unwrap();
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
