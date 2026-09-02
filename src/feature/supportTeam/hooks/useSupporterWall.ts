import { useQuery } from "@tanstack/react-query";
import type { SupportTeamMember } from "feature/supportTeam/types/supportTeam.types";
import { sortSupporterWall } from "feature/supportTeam/utils/supportTeam.utils";
import { useMemo } from "react";

export const SUPPORTER_WALL_QUERY_KEY = ["support-team", "wall"] as const;

const fetchSupporterWall = async (): Promise<SupportTeamMember[]> => {
  const res = await fetch("/api/support-team?levels=1");
  if (!res.ok) return [];
  const data = (await res.json()) as { members?: SupportTeamMember[] };
  return data.members ?? [];
};

/**
 * The roster with everyone's current level on it, for the supporter wall.
 *
 * A query of its own rather than a flag on `useSupportTeam`: that one runs on
 * every page to decide who gets a gold ring, and it shouldn't start reading a
 * user document per supporter because one page lists them.
 */
export const useSupporterWall = () => {
  const { data, isPending } = useQuery({
    queryKey: SUPPORTER_WALL_QUERY_KEY,
    queryFn: fetchSupporterWall,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const members = useMemo(() => sortSupporterWall(data ?? []), [data]);

  return { members, isLoading: isPending };
};
