import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelDuelTicket,
  duelOverviewQueryKey,
  fetchDuelOverview,
  joinDuel,
} from "feature/duels/services/duels.service";
import { useEffect, useState } from "react";

/**
 * The duels page's data. Refetched on every visit — a run banked in a session
 * just now has to show on the way back — and every minute while open, so an
 * opponent's attempts and a fresh pairing turn up without a reload.
 */
export const useDuelOverview = (uid: string | null) =>
  useQuery({
    queryKey: duelOverviewQueryKey(uid),
    queryFn: fetchDuelOverview,
    enabled: !!uid,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnMount: "always",
  });

export const useJoinDuel = (uid: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: joinDuel,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: duelOverviewQueryKey(uid) }),
  });
};

export const useCancelDuelTicket = (uid: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelDuelTicket,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: duelOverviewQueryKey(uid) }),
  });
};

/** A clock for countdowns, ticking once a minute (or faster when asked). */
export const useNow = (intervalMs = 60_000) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
};
