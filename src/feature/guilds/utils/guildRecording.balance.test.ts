import type { RecordingRating } from "feature/guilds/data/guildRecording";
import {
  getRecordingContract,
  RECORDING_TIERS,
  sessionBpm,
} from "feature/guilds/data/guildRecording";
import { STUDIO_ITEMS } from "feature/guilds/data/guildStudio";
import {
  drawClient,
  judgeTake,
  layTake,
  openSession,
  ratingRank,
  recordingPerks,
  sessionStanding,
  settleSession,
} from "feature/guilds/utils/guildRecording.utils";
import type { GuildStudio } from "feature/guilds/utils/guildStudio.utils";
import { describe, expect, it } from "vitest";

/**
 * What the numbers are meant to do, played out with the real rules: a guild
 * of a given size, diligence and skill spends a week on each tier, laying
 * every take it has on whichever tape is emptiest.
 *
 * These are not the balance — that is the table in guildRecording.ts — but
 * the promises it was tuned to keep. A rebalance that breaks one of them
 * has changed who the module is for, and should say so here.
 */

const NONE: GuildStudio = { roomLevel: 1, items: {} };
const MID: GuildStudio = {
  roomLevel: 2,
  items: {
    amp: 2,
    drums: 2,
    mic: 1,
    sofa: 2,
    desk: 2,
    walls: 2,
    tape: 1,
    bench: 1,
  },
};
const FULL: GuildStudio = {
  roomLevel: 4,
  items: Object.fromEntries(STUDIO_ITEMS.map((item) => [item.id, 4])),
};

interface Guild {
  members: number;
  /** Days of the seven each member shows up, using every take they have. */
  days: number;
  /** Accuracy on tier one, and what each tier above it takes off. */
  accuracy: number;
  drop: number;
  /** The tempo they play at, as a share of the session's. */
  tempo: number;
  studio: GuildStudio;
}

/** Two friends who play now and then, in an empty garage. */
const CASUAL: Guild = {
  members: 2,
  days: 4,
  accuracy: 78,
  drop: 3,
  tempo: 0.9,
  studio: NONE,
};
/** Three regulars, most days of the week. */
const TYPICAL: Guild = {
  members: 3,
  days: 5,
  accuracy: 84,
  drop: 3,
  tempo: 1,
  studio: NONE,
};
const EQUIPPED: Guild = { ...TYPICAL, studio: MID };
/** Five good players, nearly every day, with a room half built. */
const STRONG: Guild = {
  members: 5,
  days: 6,
  accuracy: 90,
  drop: 2,
  tempo: 1.05,
  studio: MID,
};
/** A full guild of the best, every day, in a finished studio. */
const BEST: Guild = {
  members: 6,
  days: 7,
  accuracy: 94,
  drop: 1.5,
  tempo: 1.15,
  studio: FULL,
};

const NOW = new Date("2026-11-11T12:00:00Z");

const week = (guild: Guild, tier: number) => {
  const perks = recordingPerks(guild.studio);
  let session = openSession(tier, {}, perks, "m0", NOW, 7);
  const bpm = sessionBpm(getRecordingContract(drawClient(7).id)!, tier);
  const accuracy = guild.accuracy - guild.drop * (tier - 1);
  const { points } = judgeTake(
    { accuracy, bpm: bpm * guild.tempo, notes: 80 },
    bpm,
    perks,
  );
  const available = guild.members * guild.days * perks.takesPerDay;
  let toRelease: number | null = null;
  let used = 0;
  for (let i = 0; i < available; i++) {
    const standing = sessionStanding(session);
    if (standing.full) break;
    const emptiest = [...standing.parts].sort((a, b) => a.fill - b.fill)[0];
    session = layTake(
      session,
      `m${i % guild.members}`,
      emptiest.id,
      points,
      NOW,
      accuracy,
    );
    used++;
    if (toRelease === null && sessionStanding(session).recorded)
      toRelease = used;
  }
  const result = settleSession(session, perks, NOW);
  return {
    rating: result.rating,
    toRelease,
    available,
    net: result.bank - session.fee,
    pay: result.pay.m0 ?? 0,
  };
};

const atLeast = (rating: RecordingRating, floor: RecordingRating) =>
  ratingRank(rating) >= ratingRank(floor);

describe("the balance keeps its promises", () => {
  it("lets two casual players in an empty garage release a first record, with nothing to spare", () => {
    const first = week(CASUAL, 1);
    expect(atLeast(first.rating, "record")).toBe(true);
    // It takes most of what they have: a session is a week's work.
    expect(first.toRelease!).toBeGreaterThan(first.available * 0.6);
    // And the tier above is out of their reach as they are.
    expect(atLeast(week(CASUAL, 2).rating, "record")).toBe(false);
  });

  it("takes a lot of takes to release anything", () => {
    for (const { tier } of RECORDING_TIERS) {
      const next = sessionStanding(
        openSession(tier, {}, recordingPerks(NONE), "m0", NOW, 7),
      ).next!;
      expect(next.takes, `tier ${tier}`).toBeGreaterThanOrEqual(15);
    }
  });

  it("carries three regulars without gear up to the third tier, and no further", () => {
    expect(week(TYPICAL, 1).rating).toBe("platinum");
    expect(atLeast(week(TYPICAL, 2).rating, "gold")).toBe(true);
    expect(atLeast(week(TYPICAL, 3).rating, "record")).toBe(true);
    expect(atLeast(week(TYPICAL, 4).rating, "record")).toBe(false);
  });

  it("makes the studio worth building: the same three get a tier further with it", () => {
    for (const { tier } of RECORDING_TIERS)
      expect(
        ratingRank(week(EQUIPPED, tier).rating),
        `tier ${tier}`,
      ).toBeGreaterThanOrEqual(ratingRank(week(TYPICAL, tier).rating));
    expect(atLeast(week(EQUIPPED, 4).rating, "record")).toBe(true);
    expect(atLeast(week(EQUIPPED, 5).rating, "record")).toBe(false);
  });

  it("lets a strong guild release on the top tier, but not coast to platinum there", () => {
    const top = week(STRONG, 6);
    expect(atLeast(top.rating, "record")).toBe(true);
    expect(top.rating).not.toBe("platinum");
    expect(week(STRONG, 5).rating).not.toBe("platinum");
  });

  it("leaves platinum on the top tier to the best, with the room finished", () => {
    expect(week(BEST, 6).rating).toBe("platinum");
  });

  it("pays more the higher a guild can release, in Fame and in the treasury", () => {
    for (const guild of [TYPICAL, EQUIPPED, STRONG, BEST]) {
      const released = RECORDING_TIERS.map(({ tier }) =>
        week(guild, tier),
      ).filter((played) => atLeast(played.rating, "record"));
      // The highest tier a guild can release pays it at least as much as the first.
      const first = released[0];
      const last = released[released.length - 1];
      expect(last.pay).toBeGreaterThanOrEqual(first.pay);
      expect(last.net).toBeGreaterThan(0);
      for (const played of released) expect(played.net).toBeGreaterThan(0);
    }
  });

  it("makes overreaching cost: a tier a guild cannot release loses it money", () => {
    for (const [guild, tier] of [
      [CASUAL, 2],
      [TYPICAL, 4],
      [EQUIPPED, 5],
    ] as const)
      expect(week(guild, tier).net, `tier ${tier}`).toBeLessThan(0);
  });
});
