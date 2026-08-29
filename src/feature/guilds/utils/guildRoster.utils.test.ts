import type {
  GuildMember,
  GuildMemberTally,
} from "feature/guilds/types/guild.types";
import { rankRoster } from "feature/guilds/utils/guildRoster.utils";
import { describe, expect, it } from "vitest";

const member = (uid: string, displayName = uid): GuildMember => ({
  uid,
  displayName,
  avatar: null,
});

/** One member's week, as `readChallenge` hands it over. */
const tally = (sessions: number, done = 0, total = 2): GuildMemberTally => ({
  sessions,
  hours: {},
  done,
  total,
});

describe("rankRoster", () => {
  it("puts whoever cleared the most of the week first", () => {
    const rows = rankRoster(
      [member("a"), member("b"), member("c")],
      {
        a: tally(9, 0),
        b: tally(4, 2),
        c: tally(6, 1),
      },
      "a",
    );

    // Goals beat raw sessions: the week is decided on the goals, and somebody
    // who logged nine of one thing has still only done part of it.
    expect(rows.map((row) => row.member.uid)).toEqual(["b", "c", "a"]);
  });

  it("breaks a tie on the sessions, then on the name, ignoring case", () => {
    const rows = rankRoster(
      [member("1", "zoe"), member("2", "Ada"), member("3", "bob")],
      { 1: tally(2, 1), 2: tally(2, 1), 3: tally(5, 1) },
      "1",
    );

    expect(rows.map((row) => row.member.displayName)).toEqual([
      "bob",
      "Ada",
      "zoe",
    ]);
  });

  it("marks the founder", () => {
    const rows = rankRoster([member("a"), member("b")], {}, "a");

    expect(rows.find((row) => row.member.uid === "a")?.isFounder).toBe(true);
    expect(rows.find((row) => row.member.uid === "b")?.isFounder).toBe(false);
  });

  it("counts a member the challenge has no tally for as nothing yet", () => {
    const [row] = rankRoster([member("a")], undefined, "a", 3);

    expect(row.sessions).toBe(0);
    expect(row.done).toBe(0);
    // Their share is still the whole week's worth of goals, undone.
    expect(row.total).toBe(3);
    expect(row.isShareDone).toBe(false);
  });

  it("calls a share done only when every goal of it is", () => {
    const rows = rankRoster(
      [member("a"), member("b")],
      { a: tally(5, 2, 2), b: tally(9, 1, 2) },
      "a",
    );

    expect(rows.map((row) => row.isShareDone)).toEqual([true, false]);
  });

  it("never reads more goals done than were asked for", () => {
    const [row] = rankRoster([member("a")], { a: tally(4, 7, 2) }, "a");

    expect(row.done).toBe(2);
  });
});
