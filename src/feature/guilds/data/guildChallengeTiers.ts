import type { GuildMetric } from "feature/guilds/data/guildMetrics";
import {
  GUILD_CHALLENGE_TIER_COST,
  GUILD_CHALLENGE_TIER_COST_STEP,
  GUILD_MAX_CHALLENGE_TIERS,
} from "feature/supporterPanel/constants/supporterPanel.constants";

/**
 * The rank a guild plays at, and the week that rank asks for.
 *
 * A rank is a level in the ordinary sense: every guild starts on the first one,
 * every one above it is bought out of the guild's own Fame, each is dearer than
 * the last, and moving up is permanent. What the level buys is a *harder week* —
 * one more goal, or a bigger one — and, on the other side of it, Fame for every
 * member who actually delivers that week.
 *
 * That pairing is the whole design. A harder target alone is something nobody
 * would pay for, and Fame alone would be a faucet keyed on membership — the
 * thing `guildChallenge.ts` refused to ship. Together they are a wager: ask more
 * of every member, and every member who delivers gets paid.
 *
 * The week is a *set* of goals rather than one number, because "log some
 * sessions" says nothing about what the guild is actually practising. A rank
 * names sessions and the practice categories behind them, so moving up the
 * ladder widens what the guild has to cover — and by the top rank that is every
 * side of playing, every week.
 *
 * Every goal is stated per member and scaled by the roster, never as a flat
 * guild number: a flat target would make recruiting the whole game, cleared by
 * Tuesday in a twenty-strong guild and out of reach for three people practising
 * hard. And the reward is claimed per member against *that member's own*
 * tallies, so a big roster is never a place to hide.
 */

export interface GuildObjective {
  metric: GuildMetric;
  /** Asked of each member, each week: sessions for `sessions`, hours for the rest. */
  perMember: number;
}

export interface GuildChallengeTier {
  /** Purchases needed to be on it — 0 is the rank every guild starts on. */
  id: number;
  name: string;
  /** One line on what taking it on means, for the tile. */
  blurb: string;
  /** Everything the week asks of each member. Every one has to be cleared. */
  objectives: GuildObjective[];
  /** Fame a member who pulled their weight claims, once, in a cleared week. */
  reward: number;
}

export const GUILD_CHALLENGE_TIERS: GuildChallengeTier[] = [
  {
    id: 0,
    name: "Warm-up",
    blurb: "Show up together. The streak is the whole prize.",
    objectives: [{ metric: "sessions", perMember: 3 }],
    reward: 0,
  },
  {
    id: 1,
    name: "Rehearsal",
    blurb: "One more session each, and an hour of it on the metronome.",
    objectives: [
      { metric: "sessions", perMember: 4 },
      { metric: "technique", perMember: 1 },
    ],
    reward: 30,
  },
  {
    id: 2,
    name: "Tight",
    blurb: "Five each, real technique behind them, and ears in the week.",
    objectives: [
      { metric: "sessions", perMember: 5 },
      { metric: "technique", perMember: 2 },
      { metric: "hearing", perMember: 1 },
    ],
    reward: 60,
  },
  {
    id: 3,
    name: "Relentless",
    blurb: "Every side of playing, every week. The guild is why you practise.",
    objectives: [
      { metric: "sessions", perMember: 6 },
      { metric: "technique", perMember: 2 },
      { metric: "hearing", perMember: 1 },
      { metric: "theory", perMember: 1 },
      { metric: "creativity", perMember: 1 },
    ],
    reward: 100,
  },
];

export const GUILD_BASE_CHALLENGE_TIER = GUILD_CHALLENGE_TIERS[0];

/** The level a rank is shown as — the ladder counts from one, the store from zero. */
export const tierLevel = (tier: GuildChallengeTier): number => tier.id + 1;

/** How many levels the ladder has, counting the free one. */
export const GUILD_CHALLENGE_LEVELS = GUILD_CHALLENGE_TIERS.length;

/**
 * The sessions a rank asks of each member.
 *
 * Sessions are the one goal every rank carries and the one the roster is read
 * by, so it is worth pulling out by name rather than searching the list at
 * every call site.
 */
export const sessionsAsked = (tier: GuildChallengeTier): number =>
  tier.objectives.find((objective) => objective.metric === "sessions")
    ?.perMember ?? GUILD_BASE_CHALLENGE_TIER.objectives[0].perMember;

/**
 * The rank a guild is on.
 *
 * A stored count that is missing, fractional or past the end of the ladder
 * reads as the nearest real rank rather than throwing: guilds founded before
 * this existed have no field for it, and a document can hold anything.
 */
export const challengeTierOf = (bought: unknown): GuildChallengeTier => {
  const index =
    typeof bought === "number" && Number.isFinite(bought)
      ? Math.min(
          Math.max(Math.floor(bought), 0),
          GUILD_CHALLENGE_TIERS.length - 1,
        )
      : 0;
  return GUILD_CHALLENGE_TIERS[index];
};

/**
 * What it costs the guild to get onto a rank, or null for the one every guild
 * already has. Each step is `GUILD_CHALLENGE_TIER_COST_STEP` dearer than the
 * one below it.
 */
export const tierCost = (tier: GuildChallengeTier): number | null =>
  tier.id <= 0 || tier.id > GUILD_MAX_CHALLENGE_TIERS
    ? null
    : GUILD_CHALLENGE_TIER_COST +
      (tier.id - 1) * GUILD_CHALLENGE_TIER_COST_STEP;

/** The rank above the one the guild is on, or null at the top of the ladder. */
export const nextChallengeTier = (
  bought: unknown,
): GuildChallengeTier | null => {
  const next = challengeTierOf(bought).id + 1;
  return next <= GUILD_MAX_CHALLENGE_TIERS ? GUILD_CHALLENGE_TIERS[next] : null;
};
