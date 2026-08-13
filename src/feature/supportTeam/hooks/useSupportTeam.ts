import { useQuery } from "@tanstack/react-query";
import type { SupportTeamMember } from "feature/supportTeam/types/supportTeam.types";
import { buildSupportMemberIndex } from "feature/supportTeam/utils/supportTeam.utils";
import { useMemo } from "react";

export const SUPPORT_TEAM_QUERY_KEY = ["support-team"] as const;

const fetchSupportTeam = async (): Promise<SupportTeamMember[]> => {
  const res = await fetch("/api/support-team");
  if (!res.ok) return [];
  const data = (await res.json()) as { members?: SupportTeamMember[] };
  return data.members ?? [];
};

/**
 * The support roster, served from a single backend-maintained document — the
 * feed and the presence list only carry uids, and clients can't read other
 * users' documents, so the mark can't be resolved per user on the client.
 * Cached for a long while: the list changes maybe a few times a year.
 */
export const useSupportTeam = () => {
  const { data } = useQuery({
    queryKey: SUPPORT_TEAM_QUERY_KEY,
    queryFn: fetchSupportTeam,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const members = useMemo(() => data ?? [], [data]);
  const index = useMemo(() => buildSupportMemberIndex(members), [members]);

  return useMemo(
    () => ({
      members,
      getSupportMember: (uid?: string | null): SupportTeamMember | undefined =>
        uid ? index.get(uid) : undefined,
      isSupport: (uid?: string | null): boolean => !!uid && index.has(uid),
    }),
    [members, index],
  );
};
