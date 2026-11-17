import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchImprovOverview,
  fetchImprovRoundTakes,
  improvOverviewQueryKey,
  improvRoundTakesQueryKey,
  proposeImprovTrack,
  removeImprovTake,
  removeImprovTrack,
  submitImprovTake,
  toggleImprovVote,
} from "feature/improv/services/improv.service";
import { addFame, updatePoints } from "feature/user/store/userSlice";
import { useAppDispatch } from "store/hooks";

/**
 * The improv page's data. Refetched on every visit and once a minute while
 * open, so somebody else's take — and the round changing over at midnight —
 * turn up without a reload.
 */
export const useImprovOverview = (uid: string | null) =>
  useQuery({
    queryKey: improvOverviewQueryKey(uid),
    queryFn: fetchImprovOverview,
    enabled: !!uid,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnMount: "always",
  });

/** A closed round's takes, fetched when its row is opened. */
export const useImprovRoundTakes = (roundId: string | null) =>
  useQuery({
    queryKey: improvRoundTakesQueryKey(roundId ?? ""),
    queryFn: () => fetchImprovRoundTakes(roundId as string),
    enabled: !!roundId,
    staleTime: 5 * 60_000,
  });

/** Everything under "improv": the overview, and any archived round that is open. */
const useRefreshImprov = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["improv"] });
};

export const useSubmitImprovTake = () => {
  const refresh = useRefreshImprov();
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: submitImprovTake,
    onSuccess: (result) => {
      // The reward lands on the user document as an increment the store never
      // hears about — without this the header keeps the old totals until a reload.
      if (result.points > 0) dispatch(updatePoints(result.points));
      if (result.fame > 0) dispatch(addFame(result.fame));
    },
    onSettled: refresh,
  });
};

export const useRemoveImprovTake = () => {
  const refresh = useRefreshImprov();
  return useMutation({ mutationFn: removeImprovTake, onSettled: refresh });
};

export const useToggleImprovVote = () => {
  const refresh = useRefreshImprov();
  return useMutation({ mutationFn: toggleImprovVote, onSettled: refresh });
};

export const useRemoveImprovTrack = () => {
  const refresh = useRefreshImprov();
  return useMutation({ mutationFn: removeImprovTrack, onSettled: refresh });
};

export const useProposeImprovTrack = () => {
  const refresh = useRefreshImprov();
  return useMutation({ mutationFn: proposeImprovTrack, onSettled: refresh });
};
