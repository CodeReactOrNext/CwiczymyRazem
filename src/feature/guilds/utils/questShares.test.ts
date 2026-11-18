import type { GuildMember } from "feature/guilds/types/guild.types";
import { describe, expect, it } from "vitest";

import { questStandings, splitQuestShares } from "./questShares";

const roster = (...names: string[]): GuildMember[] =>
  names.map((name) => ({ uid: name, displayName: name, avatar: null }));

describe("splitQuestShares", () => {
  it("fills the bar exactly as far as the guild has got, biggest first", () => {
    const { shares, restWidth } = splitQuestShares(
      { progress: 50, target: 100, shares: { ann: 10, bob: 30, cid: 10 } },
      roster("ann", "bob", "cid"),
    );

    // Biggest first, each keeping the colour of their seat on the roster.
    expect(shares.map((share) => [share.name, share.seat])).toEqual([
      ["bob", 1],
      ["ann", 0],
      ["cid", 2],
    ]);
    expect(shares.map((share) => share.width)).toEqual([30, 10, 10]);
    expect(restWidth).toBe(0);
  });

  it("leaves out members with nothing in", () => {
    const { shares } = splitQuestShares(
      { progress: 5, target: 10, shares: { ann: 5, bob: 0 } },
      roster("ann", "bob"),
    );

    expect(shares.map((share) => share.name)).toEqual(["ann"]);
  });

  it("keeps what former members put in as an unnamed rest", () => {
    const { shares, restWidth } = splitQuestShares(
      { progress: 80, target: 100, shares: { ann: 60 } },
      roster("ann"),
    );

    expect(shares[0].width).toBe(60);
    expect(restWidth).toBe(20);
  });

  it("never draws past a full bar", () => {
    const { shares, restWidth } = splitQuestShares(
      { progress: 300, target: 100, shares: { ann: 200, bob: 100 } },
      roster("ann", "bob"),
    );

    const drawn = shares.reduce((total, share) => total + share.width, 0);
    expect(drawn + restWidth).toBeCloseTo(100);
  });

  it("copes with a board that carries no shares", () => {
    const { shares, restWidth } = splitQuestShares(
      { progress: 40, target: 100, shares: undefined as never },
      roster("ann"),
    );

    expect(shares).toEqual([]);
    expect(restWidth).toBe(40);
  });
});

describe("questStandings", () => {
  it("lists every member against the bar, furthest along first", () => {
    expect(
      questStandings({ shares: { ann: 3, bob: 7 } }, 5, roster("ann", "bob", "cid")),
    ).toEqual([
      { uid: "bob", name: "bob", value: 7, done: true },
      { uid: "ann", name: "ann", value: 3, done: false },
      { uid: "cid", name: "cid", value: 0, done: false },
    ]);
  });
});
