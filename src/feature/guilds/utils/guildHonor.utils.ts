import type { GuildHonor } from "feature/guilds/types/guild.types";
import type { StashItemKind } from "feature/guilds/types/stash.types";

/**
 * Honor: the guild's own currency, earned by putting in and spent on the shelf.
 *
 * Everything a member gives the guild — Fame into the bank, tokens into a pot,
 * gear onto the shelf — used to be paid back in nothing but a name on a list.
 * Honor is the receipt: every deposit credits the member with it, and the one
 * thing it buys is taking gear off the guild's shelf. The loop closes on
 * purpose. A member who only ever takes has no honor to take with, and a member
 * who funds the guild's Fame can kit themselves out from the shelf without
 * having left a single string on it.
 *
 * Kept per member on the guild document as two counters, earned and spent,
 * rather than one balance: the balance is what the shelf charges against, and
 * the earned total is what the roster shows as the member's standing — a
 * member who gave a lot and then took a lot has still given a lot.
 *
 * The rates are the knobs. One Fame is one honor because Fame is the currency
 * practice pays in and the shelf should be reachable by practising. A token is
 * the supporter allowance — real money, and the thing that buys the guild its
 * room — and it is priced to pay *a lot*, deliberately: one token is a Custom
 * Shop guitar's worth of honor, and the member who covers a seat step alone
 * has earned the run of the shelf for a good while.
 *
 * Earning and spending are priced differently on purpose. What a deposit earns
 * still follows `stashHonorValue` below, so leaving something good is worth
 * more than leaving junk. What a *take* costs is flat — `TAKE_HONOR_COST`,
 * the same ten honor for a stack of screws or a Custom Shop guitar — because
 * honor is not easy to come by, and a price that scaled with the item's own
 * value made the shelf unreachable right after the one deposit that would have
 * paid for it. `TAKE_DAILY_LIMIT` is what stops a big balance from clearing
 * the shelf in one visit; the flat price is what makes reaching it in the
 * first place not feel like a toll on every single thing.
 */

export const HONOR_PER_FAME = 1;
export const HONOR_PER_TOKEN = 250;

/**
 * What taking anything off the shelf costs, flat — see the note above on why
 * this is not `stashHonorValue`.
 */
export const TAKE_HONOR_COST = 10;

/**
 * Takes off the shelf, per member, per day, whatever their balance —
 * enforced in `lib/guild/guildStash.ts` and named here too, since the client
 * says the same number back to a member before they hit it.
 */
export const TAKE_DAILY_LIMIT = 5;

/** What a piece of gear is worth on the shelf, by rarity — earned leaving it, paid taking it. */
const GEAR_HONOR: Record<string, number> = {
  Common: 20,
  Uncommon: 30,
  Rare: 50,
  Epic: 80,
  Legendary: 120,
  Mythic: 180,
  "Custom Shop": 250,
};

/** A rescued mod is worth the same whatever its bonus reads. */
const MOD_HONOR = 30;

/** Parts by tier, per piece — a stack of twelve Epic pickups is twelve times this. */
const PART_HONOR: Record<string, number> = {
  Standard: 1,
  Epic: 3,
  Legendary: 6,
  Unique: 12,
};

const num = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/**
 * What leaving a piece on the shelf earns its owner, by rarity. Only the
 * deposit side uses this now — see `TAKE_HONOR_COST` for what a take costs.
 *
 * `rarity` is the free-text rarity the entry stores — a gear rarity, a part's
 * tier, or a mod's bonus — and anything the tables do not know is priced as
 * the plainest of its kind rather than as nothing, so an unpriced item can
 * never be worth nothing to leave.
 */
export const stashHonorValue = (
  kind: StashItemKind,
  rarity: string,
  qty = 1,
): number => {
  const pieces = Math.max(1, Math.floor(num(qty)));
  switch (kind) {
    case "guitar":
    case "effect":
      return GEAR_HONOR[rarity] ?? GEAR_HONOR.Common;
    case "mod":
      return MOD_HONOR;
    case "part":
      return (PART_HONOR[rarity] ?? PART_HONOR.Standard) * pieces;
    default:
      return GEAR_HONOR.Common;
  }
};

/** Honor for Fame put into the guild's bank. */
export const honorForFame = (fame: number): number =>
  Math.max(0, Math.floor(num(fame) * HONOR_PER_FAME));

/** Honor for tokens put into one of the guild's pots. */
export const honorForTokens = (tokens: number): number =>
  Math.max(0, Math.floor(num(tokens) * HONOR_PER_TOKEN));

const EMPTY_HONOR: GuildHonor = { earned: 0, spent: 0, balance: 0 };

/** One member's honor off the stored counters, never negative and never NaN. */
const honorOf = (stored: unknown): GuildHonor => {
  const entry = (stored ?? {}) as Record<string, unknown>;
  const earned = Math.max(0, Math.floor(num(entry.earned)));
  const spent = Math.max(0, Math.floor(num(entry.spent)));
  return { earned, spent, balance: Math.max(0, earned - spent) };
};

/**
 * Every member's honor as the guild document has it. Guilds from before honor
 * existed have no field for it and read as nobody having any, which is true.
 */
export const readHonor = (
  data: Record<string, any> | undefined,
): Record<string, GuildHonor> => {
  const stored = data?.honor;
  if (!stored || typeof stored !== "object") return {};
  return Object.fromEntries(
    Object.entries(stored as Record<string, unknown>).map(([uid, entry]) => [
      uid,
      honorOf(entry),
    ]),
  );
};

/** One member's honor, or none. */
export const honorFor = (
  data: Record<string, any> | undefined,
  uid: string,
): GuildHonor => readHonor(data)[uid] ?? EMPTY_HONOR;

/** The roster by honor earned, most first — who has given the guild the most. */
export const rankByHonor = (
  honor: Record<string, GuildHonor>,
): Array<{ uid: string } & GuildHonor> =>
  Object.entries(honor)
    .map(([uid, entry]) => ({ uid, ...entry }))
    .sort((a, b) => b.earned - a.earned || a.uid.localeCompare(b.uid));
