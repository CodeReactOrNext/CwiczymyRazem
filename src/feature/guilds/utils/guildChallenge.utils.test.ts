import type { GuildChallengeTier } from "feature/guilds/data/guildChallengeTiers";
import {
  challengeTierOf,
  GUILD_CHALLENGE_TIERS,
  nextChallengeTier,
  sessionsAsked,
  tierCost,
  tierLevel,
} from "feature/guilds/data/guildChallengeTiers";
import type { GuildMetric } from "feature/guilds/data/guildMetrics";
import { GUILD_MAX_CHALLENGE_TIERS } from "feature/supporterPanel/constants/supporterPanel.constants";
import { describe, expect, it } from "vitest";

import {
  canClaimReward,
  nextStreak,
  objectiveTarget,
  SESSIONS_PER_MEMBER,
  streakStillStanding,
} from "./guildChallenge.utils";

describe("objectiveTarget", () => {
  it("asks the same of every member, whatever the guild's size", () => {
    expect(objectiveTarget(4, SESSIONS_PER_MEMBER)).toBe(
      4 * SESSIONS_PER_MEMBER,
    );
    expect(objectiveTarget(20, SESSIONS_PER_MEMBER)).toBe(
      20 * SESSIONS_PER_MEMBER,
    );
  });

  it("never lets a big guild coast on a flat number", () => {
    // The whole point: twenty people are asked for twenty people's worth.
    expect(objectiveTarget(20, 3)).toBeGreaterThan(objectiveTarget(4, 3));
  });

  it("scales an hours goal the same way, to the tenth", () => {
    expect(objectiveTarget(3, 1.5)).toBe(4.5);
  });

  it("holds a floor of one share so a guild of nobody still has a week", () => {
    expect(objectiveTarget(0, 3)).toBe(3);
    expect(objectiveTarget(-5, 3)).toBe(3);
    expect(objectiveTarget(NaN, 3)).toBe(3);
  });

  it("falls back to a share of one rather than a target of zero", () => {
    expect(objectiveTarget(4, 0)).toBe(4);
    expect(objectiveTarget(4, NaN)).toBe(4);
  });
});

describe("nextStreak", () => {
  const week = { thisWeek: "2026-W35", previousWeek: "2026-W34" };

  it("extends a run that has no gap in it", () => {
    expect(
      nextStreak({ ...week, currentStreak: 3, lastCompletedWeek: "2026-W34" }),
    ).toBe(4);
  });

  it("starts again after a missed week", () => {
    expect(
      nextStreak({ ...week, currentStreak: 9, lastCompletedWeek: "2026-W31" }),
    ).toBe(1);
  });

  it("starts at one for a guild that has never cleared it", () => {
    expect(
      nextStreak({ ...week, currentStreak: 0, lastCompletedWeek: null }),
    ).toBe(1);
  });

  it("cannot be inflated by reading the same week twice", () => {
    // The rollover is lazy, so this runs on every read once the week is met.
    expect(
      nextStreak({ ...week, currentStreak: 4, lastCompletedWeek: "2026-W35" }),
    ).toBe(4);
  });

  it("survives junk in the stored streak", () => {
    expect(
      nextStreak({
        ...week,
        currentStreak: NaN,
        lastCompletedWeek: "2026-W34",
      }),
    ).toBe(1);
  });
});

describe("streakStillStanding", () => {
  const week = { thisWeek: "2026-W35", previousWeek: "2026-W34" };

  it("stands while the last win is this week or the one before", () => {
    expect(
      streakStillStanding({ ...week, lastCompletedWeek: "2026-W35" }),
    ).toBe(true);
    expect(
      streakStillStanding({ ...week, lastCompletedWeek: "2026-W34" }),
    ).toBe(true);
  });

  it("is broken the moment a week is skipped, not later", () => {
    expect(
      streakStillStanding({ ...week, lastCompletedWeek: "2026-W33" }),
    ).toBe(false);
    expect(streakStillStanding({ ...week, lastCompletedWeek: null })).toBe(
      false,
    );
  });
});

describe("canClaimReward", () => {
  const met = {
    reward: 30,
    isComplete: true,
    myShareDone: true,
    claimedWeek: null,
    thisWeek: "2026-W35",
  };

  it("pays a member who did their share of a cleared week", () => {
    expect(canClaimReward(met)).toBe(true);
  });

  it("pays nothing on a rank that pays nothing", () => {
    expect(canClaimReward({ ...met, reward: 0 })).toBe(false);
  });

  it("waits for the guild to finish every goal", () => {
    expect(canClaimReward({ ...met, isComplete: false })).toBe(false);
  });

  it("will not pay somebody the rest of the guild carried", () => {
    expect(canClaimReward({ ...met, myShareDone: false })).toBe(false);
  });

  it("pays once a week, not once a visit", () => {
    expect(canClaimReward({ ...met, claimedWeek: "2026-W35" })).toBe(false);
    expect(canClaimReward({ ...met, claimedWeek: "2026-W34" })).toBe(true);
  });
});

/** What a rank asks of one member, metric by metric. */
const askOf = (
  tier: GuildChallengeTier,
): Partial<Record<GuildMetric, number>> =>
  Object.fromEntries(
    tier.objectives.map((objective) => [objective.metric, objective.perMember]),
  );

describe("the rank ladder", () => {
  it("has a level for every purchase the upgrade track allows", () => {
    // The rank is read off the same purchase count the pot prices, so a ladder
    // longer or shorter than the track is a rank nobody can buy, or a purchase
    // with no rank behind it.
    expect(GUILD_CHALLENGE_TIERS.length - 1).toBe(GUILD_MAX_CHALLENGE_TIERS);
  });

  it("numbers the levels from one", () => {
    expect(GUILD_CHALLENGE_TIERS.map(tierLevel)).toEqual([1, 2, 3, 4]);
  });

  it("asks every rank for at least one goal, and never the same one twice", () => {
    GUILD_CHALLENGE_TIERS.forEach((tier) => {
      const metrics = tier.objectives.map((objective) => objective.metric);
      expect(metrics.length).toBeGreaterThan(0);
      expect(new Set(metrics).size).toBe(metrics.length);
      tier.objectives.forEach((objective) =>
        expect(objective.perMember).toBeGreaterThan(0),
      );
    });
  });

  it("never drops a goal a lower rank already asked for", () => {
    GUILD_CHALLENGE_TIERS.forEach((tier, index) => {
      if (index === 0) return;
      const below = askOf(GUILD_CHALLENGE_TIERS[index - 1]);
      const here = askOf(tier);

      Object.entries(below).forEach(([metric, amount]) => {
        expect(here[metric as GuildMetric] ?? 0).toBeGreaterThanOrEqual(amount);
      });
    });
  });

  it("asks more and pays more with every level", () => {
    GUILD_CHALLENGE_TIERS.forEach((tier, index) => {
      if (index === 0) return;
      const below = GUILD_CHALLENGE_TIERS[index - 1];
      const asked = askOf(below);

      // Something about the week is genuinely harder — a bigger goal, or a
      // goal that was not there before.
      expect(
        tier.objectives.some(
          (objective) => objective.perMember > (asked[objective.metric] ?? 0),
        ),
      ).toBe(true);
      expect(tier.reward).toBeGreaterThan(below.reward);
      expect(tierCost(tier)).toBeGreaterThan(tierCost(below) ?? 0);
    });
  });

  it("keeps sessions on every rank, since the roster is read by them", () => {
    GUILD_CHALLENGE_TIERS.forEach((tier) => {
      expect(sessionsAsked(tier)).toBeGreaterThan(0);
    });
    expect(sessionsAsked(GUILD_CHALLENGE_TIERS[0])).toBe(SESSIONS_PER_MEMBER);
  });

  it("costs nothing to be on the one every guild starts on", () => {
    expect(tierCost(GUILD_CHALLENGE_TIERS[0])).toBeNull();
  });

  it("reads a missing or nonsense stored count as the first rank", () => {
    expect(challengeTierOf(undefined).id).toBe(0);
    expect(challengeTierOf(-4).id).toBe(0);
    expect(challengeTierOf("2" as unknown).id).toBe(0);
  });

  it("never reads past the top of the ladder", () => {
    expect(challengeTierOf(99).id).toBe(GUILD_MAX_CHALLENGE_TIERS);
  });
});

describe("nextChallengeTier", () => {
  it("offers the level above the one the guild is standing on", () => {
    expect(nextChallengeTier(0)?.id).toBe(1);
    expect(nextChallengeTier(1)?.id).toBe(2);
  });

  it("offers the first level to a guild with nothing stored", () => {
    expect(nextChallengeTier(undefined)?.id).toBe(1);
  });

  it("offers nothing at the top", () => {
    expect(nextChallengeTier(GUILD_MAX_CHALLENGE_TIERS)).toBeNull();
    expect(nextChallengeTier(99)).toBeNull();
  });
});
