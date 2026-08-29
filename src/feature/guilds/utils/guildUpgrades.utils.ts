import type { GuildFund } from "feature/guilds/types/guild.types";
import {
  GUILD_BASE_SEATS,
  GUILD_MAX_SEAT_UPGRADES,
  GUILD_MAX_STASH_UPGRADES,
  GUILD_SEAT_COST_STEP,
  GUILD_SEAT_UPGRADE_COST,
  GUILD_SEATS_PER_UPGRADE,
  GUILD_STASH_BASE_ROWS,
  GUILD_STASH_ROW_COST,
  GUILD_STASH_ROW_COST_STEP,
  GUILD_STASH_ROWS_PER_UPGRADE,
} from "feature/supporterPanel/constants/supporterPanel.constants";

/**
 * The two things a guild can outgrow — its roster and its shelf — and what the
 * next step of either one costs.
 *
 * Both work the same way, so they are one ladder read twice rather than two
 * mechanics that drift apart: a guild owns a *count of purchases*, and the
 * limit and the price of the next step are read back off that count, here, by
 * the client and the server alike. Nothing about a guild's size is stored as a
 * size, so re-pricing either track is a constant to change rather than a
 * migration to run.
 *
 * Every step is dearer than the one before it. That is what makes a big guild
 * something several members paid for over months rather than one wallet's
 * trophy — and it is why the pot in `GuildFund` exists at all: a rising price
 * is only reachable if everybody can put something into the same one.
 *
 * Both tracks are paid in tokens, which come from donating. The challenge
 * ladder is priced the same rising way but is *not* a track here, because it is
 * bought out of the guild's own Fame rather than funded into an earmarked pot —
 * see `guildTreasury.utils.ts`.
 */

export type GuildUpgrade = "seats" | "stashRows";

interface UpgradeLadder {
  /** What a guild has before it has bought anything. */
  base: number;
  /** What one purchase adds. */
  per: number;
  /** What the first purchase costs, in tokens. */
  cost: number;
  /** How much dearer each purchase is than the one before it. */
  step: number;
  /** How many purchases the track allows. */
  max: number;
}

const LADDERS: Record<GuildUpgrade, UpgradeLadder> = {
  seats: {
    base: GUILD_BASE_SEATS,
    per: GUILD_SEATS_PER_UPGRADE,
    cost: GUILD_SEAT_UPGRADE_COST,
    step: GUILD_SEAT_COST_STEP,
    max: GUILD_MAX_SEAT_UPGRADES,
  },
  stashRows: {
    base: GUILD_STASH_BASE_ROWS,
    per: GUILD_STASH_ROWS_PER_UPGRADE,
    cost: GUILD_STASH_ROW_COST,
    step: GUILD_STASH_ROW_COST_STEP,
    max: GUILD_MAX_STASH_UPGRADES,
  },
};

/** Which field on the guild document counts each track's purchases. */
export const UPGRADE_COUNT_FIELD: Record<GuildUpgrade, string> = {
  seats: "seatUpgrades",
  stashRows: "stashUpgrades",
};

export const GUILD_UPGRADES = Object.keys(LADDERS) as GuildUpgrade[];

export const isGuildUpgrade = (value: unknown): value is GuildUpgrade =>
  typeof value === "string" && value in LADDERS;

const num = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

/**
 * Purchases made, as a whole number inside the track's ceiling.
 *
 * Guilds founded before a track existed have no field for it, and a document
 * can hold anything, so this is where a missing or nonsense count becomes an
 * unwidened guild rather than an exception.
 */
export const upgradesBought = (track: GuildUpgrade, value: unknown): number =>
  Math.min(Math.max(Math.floor(num(value)), 0), LADDERS[track].max);

/** Seats the guild has, or rows its shelf has. */
export const upgradeLimit = (
  track: GuildUpgrade,
  upgrades: unknown,
): number => {
  const ladder = LADDERS[track];
  return ladder.base + upgradesBought(track, upgrades) * ladder.per;
};

/** What the next step costs, or null once the track is as far as it goes. */
export const nextUpgradeCost = (
  track: GuildUpgrade,
  upgrades: unknown,
): number | null => {
  const ladder = LADDERS[track];
  const bought = upgradesBought(track, upgrades);
  if (bought >= ladder.max) return null;
  return ladder.cost + bought * ladder.step;
};

/** The most a guild can ever have of this, for the message that says so. */
export const upgradeCeiling = (track: GuildUpgrade): number =>
  upgradeLimit(track, LADDERS[track].max);

/** What one purchase adds, for the button that offers it. */
export const upgradeStepSize = (track: GuildUpgrade): number =>
  LADDERS[track].per;

const readPledges = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([uid, tokens]) => [uid, Math.floor(num(tokens))] as const)
      .filter(([, tokens]) => tokens > 0),
  );
};

/**
 * The pot for one track: what has been put in towards the next step, what that
 * step costs, and who has been paying.
 *
 * The pot is what is owed on the *current* step and empties every time one is
 * bought; the pledges never reset, because they are the credit for a shelf or a
 * roster the whole guild is standing in — the same reason a cosmetic keeps the
 * name of whoever bought it.
 */
export const readFund = (
  track: GuildUpgrade,
  data: Record<string, any> | undefined,
): GuildFund => {
  const stored = data?.funds?.[track] ?? {};
  const cost = nextUpgradeCost(track, data?.[UPGRADE_COUNT_FIELD[track]]);

  return {
    // A maxed-out track has nothing to pay for, so whatever is left in its pot
    // is not a number anybody should be shown a bar of.
    pot: cost === null ? 0 : Math.min(Math.floor(num(stored.pot)), cost),
    cost,
    pledges: readPledges(stored.pledges),
  };
};

/** Seats: the roster half of the ladder, named for the places that read it. */
export const guildSeatLimit = (upgrades: unknown): number =>
  upgradeLimit("seats", upgrades);

export const nextSeatCost = (upgrades: unknown): number | null =>
  nextUpgradeCost("seats", upgrades);

export const GUILD_MAX_SEATS = upgradeCeiling("seats");

/** The shelf: how many rows of sockets the guild has paid for. */
export const guildStashRowLimit = (upgrades: unknown): number =>
  upgradeLimit("stashRows", upgrades);

export const nextStashRowCost = (upgrades: unknown): number | null =>
  nextUpgradeCost("stashRows", upgrades);

export const GUILD_MAX_STASH_ROWS = upgradeCeiling("stashRows");
