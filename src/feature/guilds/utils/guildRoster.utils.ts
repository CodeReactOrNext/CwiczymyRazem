import type {
  GuildMember,
  GuildMemberTally,
} from "feature/guilds/types/guild.types";

/**
 * The roster, in the order the members tab reads it.
 *
 * Ordered by what each member put into the week rather than by when they
 * joined: the challenge is the one thing a guild does together, so the list of
 * who is in it is worth reading as the list of who is carrying it. Goals
 * cleared come first and sessions break those ties, because a week is a set of
 * goals now and clearing three of them is the thing worth being at the top for.
 * Names break the rest, so a quiet week still reads as an alphabetical roster
 * rather than as an arbitrary one.
 */
export interface RosterRow {
  member: GuildMember;
  isFounder: boolean;
  /** Sessions logged this week. */
  sessions: number;
  /** Goals they cleared on their own, of the `total` the rank asks of them. */
  done: number;
  total: number;
  /** Whether they covered their own share of the whole week. */
  isShareDone: boolean;
}

const EMPTY: GuildMemberTally = { sessions: 0, hours: {}, done: 0, total: 0 };

export const rankRoster = (
  members: GuildMember[],
  perMember: Record<string, GuildMemberTally> | undefined,
  founderUid: string,
  /** Goals the guild's current rank asks of each member. */
  objectiveCount = 1,
): RosterRow[] =>
  members
    .map((member) => {
      const tally = perMember?.[member.uid] ?? EMPTY;
      const total = Math.max(0, Math.floor(tally.total || objectiveCount));
      const done = Math.min(total, Math.max(0, Math.floor(tally.done || 0)));

      return {
        member,
        isFounder: member.uid === founderUid,
        sessions: Math.max(0, Math.floor(tally.sessions || 0)),
        done,
        total,
        isShareDone: total > 0 && done === total,
      };
    })
    .sort(
      (a, b) =>
        b.done - a.done ||
        b.sessions - a.sessions ||
        a.member.displayName.localeCompare(b.member.displayName, undefined, {
          sensitivity: "base",
        }) ||
        a.member.uid.localeCompare(b.member.uid),
    );
