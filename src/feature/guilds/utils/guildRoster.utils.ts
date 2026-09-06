import type {
  GuildMember,
  GuildMemberEffort,
} from "feature/guilds/types/guild.types";

/**
 * The roster, in the order the members tab reads it.
 *
 * Ordered by what each member has put in since the guild was founded rather
 * than by when they joined: the quests are the one thing a guild does together,
 * and they are counted out of exactly these sessions and hours, so the list of
 * who is in it is worth reading as the list of who is carrying it. Sessions
 * come first because they are the number people recognise themselves by, hours
 * break the tie, and names break the rest so a young guild still reads as an
 * alphabetical roster rather than as an arbitrary one.
 */
export interface RosterRow {
  member: GuildMember;
  isFounder: boolean;
  /** Sessions logged since the guild was founded. */
  sessions: number;
  /** Hours of practice in the same window, to the tenth. */
  hours: number;
}

const EMPTY: GuildMemberEffort = { sessions: 0, hours: 0 };

const tenth = (value: number): number =>
  Math.round(Math.max(0, Number(value) || 0) * 10) / 10;

export const rankRoster = (
  members: GuildMember[],
  perMember: Record<string, GuildMemberEffort> | undefined,
  founderUid: string,
): RosterRow[] =>
  members
    .map((member) => {
      const effort = perMember?.[member.uid] ?? EMPTY;
      return {
        member,
        isFounder: member.uid === founderUid,
        sessions: Math.max(0, Math.floor(Number(effort.sessions) || 0)),
        hours: tenth(effort.hours),
      };
    })
    .sort(
      (a, b) =>
        b.sessions - a.sessions ||
        b.hours - a.hours ||
        a.member.displayName.localeCompare(b.member.displayName, undefined, {
          sensitivity: "base",
        }) ||
        a.member.uid.localeCompare(b.member.uid),
    );
