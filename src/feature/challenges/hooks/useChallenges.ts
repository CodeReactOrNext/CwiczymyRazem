import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ensureCurrentChallenge,
  getChallenge,
  getChallengeSubmissions,
  getPastChallenges,
  invalidateChallengeCaches,
} from "feature/challenges/services/challenges.service";
import {
  getNominations,
  nominateSong,
  toggleNominationVote,
} from "feature/challenges/services/nominations.service";
import type { SubmitChallengeParams } from "feature/challenges/services/submitChallenge.service";
import {
  AlreadySubmittedError,
  submitChallengeRecording,
} from "feature/challenges/services/submitChallenge.service";
import type { ChallengeNomination } from "feature/challenges/types/challenge.types";
import { CHALLENGE_SONG_COUNT } from "feature/challenges/types/challenge.types";
import {
  currentChallengeId,
  votingChallengeId,
} from "feature/challenges/utils/challengeMonth";
import type { Song } from "feature/songs/types/songs.type";
import { addFame, updatePoints } from "feature/user/store/userSlice";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

const STALE_TIME = 60 * 1000;

/**
 * The live board. Drawing it is the backend's job, so the first read of a new
 * month asks for the roll-over before fetching.
 */
export const useCurrentChallenge = () => {
  const challengeId = currentChallengeId();

  return useQuery({
    queryKey: ["challenge", challengeId],
    queryFn: async () => {
      const existing = await getChallenge(challengeId);
      if (existing) return existing;
      await ensureCurrentChallenge();
      invalidateChallengeCaches();
      return getChallenge(challengeId);
    },
    staleTime: STALE_TIME,
  });
};

export const useChallengeSubmissions = (challengeId: string | undefined) =>
  useQuery({
    queryKey: ["challengeSubmissions", challengeId],
    queryFn: () => getChallengeSubmissions(challengeId as string),
    enabled: !!challengeId,
    staleTime: STALE_TIME,
  });

export const usePastChallenges = () =>
  useQuery({
    queryKey: ["challenges", "past"],
    queryFn: () => getPastChallenges(),
    staleTime: 5 * 60 * 1000,
  });

export const useNominations = () => {
  const challengeId = votingChallengeId();

  return useQuery({
    queryKey: ["challengeNominations", challengeId],
    queryFn: () => getNominations(challengeId),
    staleTime: STALE_TIME,
  });
};

export const useChallengeMutations = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const ballotId = votingChallengeId();

  const refreshBoard = (challengeId: string) => {
    invalidateChallengeCaches();
    queryClient.invalidateQueries({ queryKey: ["challenge", challengeId] });
    queryClient.invalidateQueries({
      queryKey: ["challengeSubmissions", challengeId],
    });
    // A late run bumps a closed board's counters, so the archive list is stale too.
    queryClient.invalidateQueries({ queryKey: ["challenges", "past"] });
    queryClient.invalidateQueries({ queryKey: ["recordings"] });
  };

  const refreshBallot = () => {
    invalidateChallengeCaches();
    queryClient.invalidateQueries({
      queryKey: ["challengeNominations", ballotId],
    });
  };

  const submit = useMutation({
    mutationFn: (params: SubmitChallengeParams) =>
      submitChallengeRecording(params),
    onSuccess: (reward, params) => {
      refreshBoard(params.challenge.id);
      // The reward lands on the user document as an increment, which the store
      // holding the header and profile numbers never hears about — without this
      // the toast promises points the app goes on showing the old total for
      // until the next reload.
      if (reward.isPaid) {
        if (reward.points > 0) dispatch(updatePoints(reward.points));
        if (reward.fame > 0) dispatch(addFame(reward.fame));
      }
      if (!reward.isPaid) {
        toast.success(
          reward.isClear
            ? "Archive board cleared! Late runs don't pay points or fame."
            : "Run added to the archive — no points or fame for a closed board.",
        );
        return;
      }
      // Past the per-board points cap the run still pays fame, so say what it
      // earned rather than flashing a "+0 points" that reads like a bug.
      if (reward.points === 0) {
        toast.success(
          `Recording accepted — +${reward.fame} fame. Points stop after ${CHALLENGE_SONG_COUNT} songs on one board.`,
        );
        return;
      }
      toast.success(
        reward.isClear
          ? `Board cleared! +${reward.points} points and +${reward.fame} fame`
          : `Recording accepted — +${reward.points} points, +${reward.fame} fame`,
      );
    },
    onError: (error) => {
      if (error instanceof AlreadySubmittedError) {
        toast.error("You already have a recording on that song.");
        return;
      }
      console.error(error);
      toast.error("Couldn't submit your recording. Try again.");
    },
  });

  const nominate = useMutation({
    mutationFn: (params: { song: Song; userId: string; userName: string }) =>
      nominateSong({ challengeId: ballotId, ...params }),
    onSuccess: () => {
      refreshBallot();
      toast.success("Nominated — your vote is on it.");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Couldn't add that nomination.");
    },
  });

  const vote = useMutation({
    mutationFn: (params: {
      nomination: ChallengeNomination;
      userId: string;
      userName: string;
    }) => toggleNominationVote(params.nomination, params.userId, params.userName),
    onSuccess: () => refreshBallot(),
    onError: (error) => {
      console.error(error);
      toast.error("Couldn't register your vote.");
      refreshBallot();
    },
  });

  return {
    submitRecording: submit.mutateAsync,
    isSubmitting: submit.isPending,
    nominate: nominate.mutateAsync,
    isNominating: nominate.isPending,
    toggleVote: vote.mutateAsync,
    isVoting: vote.isPending,
  };
};
