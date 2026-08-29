/**
 * One currency for everything a supporter can do: tokens.
 *
 * A dollar buys tokens, once, at the rate below. They sit in the wallet until
 * they are spent: nothing expires and nothing refills on a timer. A recurring
 * Buy Me a Coffee membership still pays more than a single coffee, because
 * every renewal is another donation arriving through the same webhook — the
 * money is what pays, not the calendar.
 *
 * The rate is what makes the prices under it legible: at 10 tokens a dollar a
 * token is worth about ten cents, so backing an idea costs a dime, a gear
 * proposal costs eighty of them and founding a guild costs ten dollars.
 * Re-pricing the whole economy is this one number.
 */

/** Tokens a dollar buys. Every donation, including each membership renewal. */
export const TOKENS_PER_DOLLAR = 10;

/**
 * What the badge itself is worth, once — enough to put an idea up and back a
 * few, which is the whole of what the badge alone buys. Founding a guild is
 * deliberately out of its reach: a permanent claim on a name is not something
 * the welcome grant should hand out. It covers hand-marked thank-yous, who have
 * donated nothing the webhook ever saw.
 */
export const SUPPORTER_WELCOME_TOKENS = 10;

/** Posting an idea onto the roadmap board. */
export const IDEA_COST = 5;

/** Backing someone's idea, per point of weight. */
export const IDEA_BACK_COST = 1;

/**
 * Ceiling on how much weight one person may put on a single idea. Without it a
 * large wallet could carry a row on its own, and the board would rank by money
 * rather than by how many people want the thing.
 */
export const MAX_BACKING_PER_IDEA = 3;

/** Voting on which community goal runs next week. */
export const GOAL_VOTE_COST = 1;

/**
 * Proposing gear costs more than an idea: it is a spec somebody has to draw,
 * balance and fit into the drop tables, and the price is what keeps the board a
 * shortlist of things people actually want rather than a wishlist.
 */
export const GEAR_PROPOSAL_COST = 8;
export const GEAR_BACK_COST = 1;
export const MAX_BACKING_PER_GEAR = 3;

/** Backing one item for one seat of the next supporter-case slate. */
export const SLATE_VOTE_COST = 1;

/**
 * Founding a guild, and by a distance the dearest thing a supporter buys.
 *
 * It is priced apart from everything else here because it is the only thing
 * that claims something nobody else can have afterwards: a name and a tag,
 * permanently, out of a namespace of five characters. Every other price on this
 * page buys a turn — a vote, a row on a board, a wider room — and turns come
 * round again. A tag does not.
 *
 * Ten dollars, which is well past the welcome grant on purpose: a badge alone
 * must not be able to take a name off the board, or the hand-marked thank-yous
 * would be the cheapest land grab in the app. It also means a guild is founded
 * by somebody who has already paid for one, not by somebody trying the button.
 */
export const GUILD_FOUNDING_COST = 100;

/**
 * Seats a guild starts with, founder included. Deliberately small: a guild is
 * meant to be a room where everybody knows who else is in it, and making that
 * room bigger is what the tokens are for.
 */
export const GUILD_BASE_SEATS = 6;

/** Seats one purchase adds. */
export const GUILD_SEATS_PER_UPGRADE = 3;

/**
 * What the first three seats cost, and how much dearer every purchase after it
 * gets. Rising rather than flat so a large guild is something several members
 * chipped in for across a few months, not one wallet's trophy.
 */
export const GUILD_SEAT_UPGRADE_COST = 6;
export const GUILD_SEAT_COST_STEP = 3;

/**
 * How many times the room can be widened. There is a ceiling at all because
 * the roster travels inside the guild document — every member is read on every
 * visit to the page — and because a guild nobody can keep track of is a chat
 * room with a badge.
 */
export const GUILD_MAX_SEAT_UPGRADES = 8;

/**
 * Rows the guild's shelf starts with, twelve sockets each.
 *
 * Small on purpose, and for the same reason the roster is: a shelf with room
 * for everything is a warehouse nobody reads, and the room itself is what the
 * guild chips in for. A guitar hangs across two sockets, so a starting shelf
 * holds about a dozen instruments, or two dozen pedals.
 */
export const GUILD_STASH_BASE_ROWS = 2;

/** Rows one purchase adds. */
export const GUILD_STASH_ROWS_PER_UPGRADE = 1;

/**
 * What the third row costs, and how much dearer every row after it gets.
 * Cheaper than seats: a row is shelf space rather than a person, and a guild is
 * meant to buy several of them over its life rather than agonise over the
 * first.
 */
export const GUILD_STASH_ROW_COST = 4;
export const GUILD_STASH_ROW_COST_STEP = 2;

/**
 * How many rows can be bought. There is a ceiling because the whole shelf is
 * read on every visit to the tab, and because a shelf nobody can scan is where
 * gear goes to be forgotten rather than used.
 */
export const GUILD_MAX_STASH_UPGRADES = 8;

/**
 * Taking on a harder week, and what the first step up costs the guild.
 *
 * Paid out of the guild's own Fame (see `guildTreasury.utils.ts`), not out of
 * tokens — a harder practice week is bought with the currency practice earns,
 * so a roster of players who have never donated can still reach the top of the
 * ladder. The price rises with every step for the same reason seats do: a tier
 * the whole guild saved for is a different thing from one the richest member
 * bought on a whim.
 *
 * The first tier is about a case pull each in a six-strong guild, and pays
 * itself back in about three weeks of the guild actually clearing it.
 */
export const GUILD_CHALLENGE_TIER_COST = 500;
export const GUILD_CHALLENGE_TIER_COST_STEP = 800;

/**
 * How far the ladder goes. Four tiers in total counting the free one, and the
 * last asks six sessions a week of every member — past that the target stops
 * being a challenge and starts being a reason to leave the guild.
 */
export const GUILD_MAX_CHALLENGE_TIERS = 3;

export const IDEA_TITLE_MAX = 90;
export const IDEA_DESCRIPTION_MAX = 600;
