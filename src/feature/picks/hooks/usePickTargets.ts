import { useQuery } from "@tanstack/react-query";
import { fetchPickTargets } from "feature/picks/services/picks.service";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";

export const pickTargetsKey = (uid: string | null | undefined) =>
  ["picks", "targets", uid ?? null] as const;

/**
 * Who the post-session summary offers a pick to. Fetched when the summary opens — during the
 * celebration, so it is there by the time the player reaches the step — and not refreshed while it
 * is up: the list a player is tossing picks at must not reshuffle under their finger.
 */
export const usePickTargets = () => {
  const uid = useAppSelector(selectUserAuth);

  return useQuery({
    queryKey: pickTargetsKey(uid),
    queryFn: fetchPickTargets,
    enabled: !!uid,
    staleTime: 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
};
