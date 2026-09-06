import type { GuildMember } from "feature/guilds/types/guild.types";
import { rankRoster } from "feature/guilds/utils/guildRoster.utils";
import { describe, expect, it } from "vitest";

const member = (uid: string, displayName = uid): GuildMember => ({
  uid,
  displayName,
  avatar: null,
});

describe("rankRoster", () => {
  it("puts whoever has logged the most sessions first", () => {
    const rows = rankRoster(
      [member("a"), member("b"), member("c")],
      {
        a: { sessions: 4, hours: 9 },
        b: { sessions: 9, hours: 2 },
        c: { sessions: 6, hours: 6 },
      },
      "a",
    );

    expect(rows.map((row) => row.member.uid)).toEqual(["b", "c", "a"]);
  });

  it("breaks a tie on the hours, then on the name, ignoring case", () => {
    const rows = rankRoster(
      [member("z", "zed"), member("b", "Bea"), member("a", "ann")],
      {
        z: { sessions: 3, hours: 1 },
        b: { sessions: 3, hours: 2.5 },
        a: { sessions: 3, hours: 1 },
      },
      "z",
    );

    expect(rows.map((row) => row.member.displayName)).toEqual([
      "Bea",
      "ann",
      "zed",
    ]);
  });

  it("reads a member the board has nothing for as nothing yet", () => {
    const [row] = rankRoster([member("a")], undefined, "a");

    expect(row).toMatchObject({ sessions: 0, hours: 0, isFounder: true });
  });

  it("marks the founder and nobody else", () => {
    const rows = rankRoster([member("a"), member("b")], {}, "b");

    expect(rows.map((row) => [row.member.uid, row.isFounder])).toEqual([
      ["a", false],
      ["b", true],
    ]);
  });

  it("rounds hours to the tenth and never below zero", () => {
    const [row] = rankRoster(
      [member("a")],
      { a: { sessions: -2, hours: 1.26 } },
      "a",
    );

    expect(row.sessions).toBe(0);
    expect(row.hours).toBe(1.3);
  });
});
