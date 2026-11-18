import type {
  GuildMember,
  GuildQuestProgress,
} from "feature/guilds/types/guild.types";

export interface QuestShare {
  uid: string;
  name: string;
  /** The member's own number, in the quest's unit. */
  value: number;
  /**
   * The member's seat on the roster, 0-based — what picks their colour, so one
   * player is the same colour on every quest however much they put into each.
   */
  seat: number;
  /** Width on the bar, in percent of the whole track. */
  width: number;
}

export interface QuestShareSplit {
  /** Everybody who has put something in, biggest first. */
  shares: QuestShare[];
  /** Bar width nobody on the roster accounts for — members who have left. */
  restWidth: number;
}

const byValueThenName = (a: QuestShare, b: QuestShare): number =>
  b.value - a.value || a.name.localeCompare(b.name);

/**
 * Who put in what on a quest that counts the guild, as widths that fill the
 * bar exactly as far as the guild has got. Members with nothing in are left
 * out — a row of zeroes says nothing the missing name does not.
 */
export const splitQuestShares = (
  quest: Pick<GuildQuestProgress, "progress" | "target" | "shares">,
  members: GuildMember[],
): QuestShareSplit => {
  const filled =
    quest.target > 0
      ? Math.min(100, (quest.progress / quest.target) * 100)
      : 0;

  const contributors = members
    .map((member, seat) => ({
      uid: member.uid,
      name: member.displayName,
      value: Math.max(0, quest.shares?.[member.uid] ?? 0),
      seat,
      width: 0,
    }))
    .filter((share) => share.value > 0)
    .sort(byValueThenName);

  // Scaled against whichever is bigger, so the segments never overrun the fill
  // when rounding makes the shares add up to a hair more than the total.
  const named = contributors.reduce((total, share) => total + share.value, 0);
  const whole = Math.max(quest.progress, named);

  const shares = contributors.map((share) => ({
    ...share,
    width: whole > 0 ? (share.value / whole) * filled : 0,
  }));
  const used = shares.reduce((total, share) => total + share.width, 0);

  return { shares, restWidth: Math.max(0, filled - used) };
};

export interface QuestStanding {
  uid: string;
  name: string;
  value: number;
  done: boolean;
}

/**
 * Where every member stands on a quest that asks something of each of them —
 * the ones over the bar first, then whoever is closest to it.
 */
export const questStandings = (
  quest: Pick<GuildQuestProgress, "shares">,
  bar: number,
  members: GuildMember[],
): QuestStanding[] =>
  members
    .map((member) => {
      const value = Math.max(0, quest.shares?.[member.uid] ?? 0);
      return {
        uid: member.uid,
        name: member.displayName,
        value,
        done: value >= bar,
      };
    })
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
