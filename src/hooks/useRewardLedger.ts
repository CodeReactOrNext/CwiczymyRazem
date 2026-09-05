import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AchievementList } from "feature/achievements/types";
import { ARSENAL_QUERY_KEY } from "feature/arsenal/hooks/useArsenalData";
import { selectUserAuth, setFame } from "feature/user/store/userSlice";
import type { RewardPayout } from "lib/rewards/rewardPayout";
import {
  claimAchievementRewards,
  claimJourneyReward,
  claimRoadmapReward,
  claimScaleReward,
  fetchRewardLedger,
} from "lib/rewards/rewards.service";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "store/hooks";

export const REWARD_LEDGER_QUERY_KEY = ["rewards", "ledger"];

/**
 * The reward ledger — badges, finished scale trees and the free-case wallet.
 *
 * Read from the server rather than off the user document the client already
 * holds: what has been paid for lives in a field no client may write, and
 * therefore in one no client is handed a live copy of.
 */
export const useRewardLedger = () => {
  const userAuth = useAppSelector(selectUserAuth);

  return useQuery({
    queryKey: REWARD_LEDGER_QUERY_KEY,
    queryFn: fetchRewardLedger,
    // The token comes off the signed-in user, so the query cannot run before
    // Firebase has resolved one.
    enabled: Boolean(userAuth),
    staleTime: 30_000,
  });
};

/** What a claim paid, as one line — parts as a count, since the panel lists them. */
const payoutLine = (reward: RewardPayout): string => {
  const parts = reward.parts.reduce((sum, part) => sum + part.qty, 0);
  return [
    reward.fame > 0 ? `${reward.fame} Fame` : null,
    reward.caseTokens > 0
      ? `${reward.caseTokens} free ${reward.caseTokens === 1 ? "case" : "cases"}`
      : null,
    parts > 0 ? `${parts} ${parts === 1 ? "part" : "parts"}` : null,
  ]
    .filter(Boolean)
    .join(", ");
};

/**
 * Everything a payout has to touch once it lands: the Fame counter outside the
 * query, the ledger itself, and the Arsenal — parts and free cases both go into
 * the stash, which reads from its own query.
 */
const useClaimSideEffects = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return (reward: RewardPayout, newFame: number, headline: string) => {
    dispatch(setFame(newFame));
    toast.success(`${headline}: ${payoutLine(reward)}`);
    queryClient.invalidateQueries({ queryKey: REWARD_LEDGER_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
  };
};

export const useClaimAchievementRewards = () => {
  const onClaimed = useClaimSideEffects();

  return useMutation({
    mutationFn: (achievementIds?: AchievementList[]) =>
      claimAchievementRewards(achievementIds),
    onSuccess: (result) => {
      const count = result.claimed.length;
      onClaimed(
        result.reward,
        result.newFame,
        count === 1 ? "Reward collected" : `${count} rewards collected`,
      );
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error || "Could not collect the reward",
      );
    },
  });
};

export interface ClaimScaleInput {
  scaleType: string;
  /** The fret the box is anchored at. */
  position: number;
}

/**
 * Collects a finished roadmap.
 *
 * The toast names the guitar rather than the payout: the Fame and the parts are
 * the small half of this reward, and "you now own a Legendary" is the sentence
 * the player actually wants to read.
 */
export const useClaimJourneyReward = () => {
  const onClaimed = useClaimSideEffects();

  return useMutation({
    mutationFn: (moduleId: string) => claimJourneyReward(moduleId),
    onSuccess: (result) => {
      onClaimed(
        result.reward,
        result.newFame,
        `${result.guitar.brand} ${result.guitar.name} is yours`,
      );
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error || "Could not collect the reward",
      );
    },
  });
};

/** Collects a finished curated roadmap. The toast names the guitar, as above. */
export const useClaimRoadmapReward = () => {
  const onClaimed = useClaimSideEffects();

  return useMutation({
    mutationFn: (roadmapId: string) => claimRoadmapReward(roadmapId),
    onSuccess: (result) => {
      onClaimed(
        result.reward,
        result.newFame,
        `${result.guitar.brand} ${result.guitar.name} is yours`,
      );
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error || "Could not collect the reward",
      );
    },
  });
};

export const useClaimScaleReward = () => {
  const onClaimed = useClaimSideEffects();

  return useMutation({
    mutationFn: ({ scaleType, position }: ClaimScaleInput) =>
      claimScaleReward(scaleType, position),
    onSuccess: (result) => {
      onClaimed(result.reward, result.newFame, "Box cleared");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error || "Could not collect the reward",
      );
    },
  });
};
