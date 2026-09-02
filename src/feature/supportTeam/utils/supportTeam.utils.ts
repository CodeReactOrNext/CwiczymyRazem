import type { SupportTeamMember } from "feature/supportTeam/types/supportTeam.types";

/**
 * "Support" alone read like a helpdesk role — these are people who put money
 * into the project, so the badge says what they actually are.
 */
export const DEFAULT_SUPPORT_TITLE = "Supporter";

/** Badge label for a member — their custom title, or the generic one. */
export const getSupportLabel = (member?: SupportTeamMember | null): string =>
  member?.title?.trim() || DEFAULT_SUPPORT_TITLE;

/** Hover text spelling out the donation, so the badge can't be misread. */
export const getSupportTooltip = (member?: SupportTeamMember | null): string =>
  `${getSupportLabel(member)} — supports Riff Quest with a donation`;

/** uid → member lookup used by the feed / presence list, which only carry uids. */
export const buildSupportMemberIndex = (
  members: SupportTeamMember[],
): Map<string, SupportTeamMember> =>
  new Map(members.map((member) => [member.uid, member]));

/**
 * Supporters come first in the "Live Now" stack — the mark is a thank-you, and
 * it only works if it is visible without hovering through the whole row.
 * Everything else keeps its original order.
 */
export const sortSupportFirst = <T extends { uid: string }>(
  users: T[],
  isSupport: (uid: string) => boolean,
): T[] =>
  [...users].sort(
    (a, b) => Number(isSupport(b.uid)) - Number(isSupport(a.uid)),
  );

/**
 * Order of the supporter wall: the highest level first, and everyone whose
 * level is missing — a roster written before levels were carried, or an account
 * that has never reported a session — after those, alphabetically.
 *
 * The roster itself arrives sorted by name, which reads like a phone book; the
 * wall is a thank-you, so the players who put the most into the app stand at
 * the front of it.
 */
export const sortSupporterWall = (
  members: SupportTeamMember[],
): SupportTeamMember[] =>
  [...members].sort(
    (a, b) =>
      (b.lvl ?? 0) - (a.lvl ?? 0) || a.displayName.localeCompare(b.displayName),
  );
