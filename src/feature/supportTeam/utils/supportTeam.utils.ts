import type { SupportTeamMember } from "feature/supportTeam/types/supportTeam.types";

export const DEFAULT_SUPPORT_TITLE = "Support";

/** Badge label for a member — their custom title, or the generic one. */
export const getSupportLabel = (member?: SupportTeamMember | null): string =>
  member?.title?.trim() || DEFAULT_SUPPORT_TITLE;

/** uid → member lookup used by the feed / presence list, which only carry uids. */
export const buildSupportMemberIndex = (
  members: SupportTeamMember[],
): Map<string, SupportTeamMember> =>
  new Map(members.map((member) => [member.uid, member]));

/**
 * Support members come first in the "Live Now" stack — the whole point of the
 * mark is that people can spot someone who can help them without hovering
 * through the whole row. Everything else keeps its original order.
 */
export const sortSupportFirst = <T extends { uid: string }>(
  users: T[],
  isSupport: (uid: string) => boolean,
): T[] =>
  [...users].sort(
    (a, b) => Number(isSupport(b.uid)) - Number(isSupport(a.uid)),
  );
