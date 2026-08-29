import type { GuildTreasury } from "feature/guilds/types/guild.types";

/**
 * The guild's own Fame.
 *
 * Every other guild purchase so far has been an earmarked pot: tokens go in
 * against one named step and the step buys itself the moment the pot is full.
 * The treasury is the opposite, on purpose. It is a balance the guild holds,
 * members top it up whenever they have Fame spare, and it is spent as a
 * deliberate act — because a balance that bought things by itself the moment it
 * crossed a threshold would mean nobody could ever save up.
 *
 * What goes in never comes out to the member who put it in. `deposits` is the
 * record of who filled it and it never resets, for the same reason a cosmetic
 * keeps the name of whoever bought it: the Fame paid for something the whole
 * guild is standing in, and a refundable deposit would just be a way of holding
 * the guild's plans hostage.
 */

const num = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

/** Smallest deposit worth a write. */
export const GUILD_DEPOSIT_MIN = 1;

const readDeposits = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([uid, fame]) => [uid, Math.floor(num(fame))] as const)
      .filter(([, fame]) => fame > 0),
  );
};

/**
 * The treasury as everything reads it.
 *
 * Guilds founded before the treasury existed have no field for it and a
 * document can hold anything, so this is where a missing or nonsense balance
 * becomes an empty treasury rather than an exception — and where a negative one
 * becomes zero, so a corrupt document can never read as a debt the guild has to
 * practise its way out of.
 */
export const readTreasury = (
  data: Record<string, any> | undefined,
): GuildTreasury => {
  const stored = data?.treasury ?? {};

  return {
    fame: Math.max(0, Math.floor(num(stored.fame))),
    deposits: readDeposits(stored.deposits),
    spent: Math.max(0, Math.floor(num(stored.spent))),
  };
};

/** Who filled it, biggest first. Ties go to whoever the roster names first. */
export const rankDepositors = (
  treasury: GuildTreasury,
): Array<{ uid: string; fame: number }> =>
  Object.entries(treasury.deposits)
    .map(([uid, fame]) => ({ uid, fame }))
    .sort((a, b) => b.fame - a.fame || a.uid.localeCompare(b.uid));
