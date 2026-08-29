import type { GuildUpgrade } from "feature/guilds/utils/guildUpgrades.utils";
import {
  GUILD_MAX_SEATS,
  GUILD_MAX_STASH_ROWS,
  nextUpgradeCost,
  UPGRADE_COUNT_FIELD,
  upgradesBought,
} from "feature/guilds/utils/guildUpgrades.utils";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { PlayerSession } from "lib/support/supporterAuth";
import { chargeTokens, userRef } from "lib/support/tokenWallet";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * Chipping in for something the guild is outgrowing.
 *
 * A guild does not buy seats or shelf rows, it *funds* them: anybody inside
 * puts as many tokens as they like into the pot for one track, and the step
 * happens by itself the moment the pot covers the price. Nobody has to hold the
 * whole cost at once, which is the only way a price that rises with every step
 * stays reachable — and it makes the size of a guild something a room paid for
 * together rather than whatever its richest member felt like buying.
 *
 * Three things are settled by the server and never by the request: which guild
 * the caller is funding (their own `guildId`, an Admin-SDK-written field), what
 * the step costs (read off the stored purchase count inside the transaction),
 * and how much of the offered amount is actually taken. That last one is the
 * whole "top it up" feel: a contribution is clamped to what is still owed, so
 * the last person to chip in pays the remainder and not a token more, and two
 * members hitting the button at once cannot between them overpay for one row.
 */

const GUILDS = "guilds";

const guildRef = (id: string): DocumentReference =>
  firestore.collection(GUILDS).doc(id);

const num = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

export type FundResult =
  | {
      ok: true;
      /** Tokens actually taken — never more than the step still owed. */
      paid: number;
      /** Whether this contribution is the one that bought the step. */
      unlocked: boolean;
    }
  | { ok: false; status: 400 | 402 | 403 | 404 | 409; error: string };

const MAXED: Record<GuildUpgrade, string> = {
  seats: `A guild tops out at ${GUILD_MAX_SEATS} seats`,
  stashRows: `A shelf tops out at ${GUILD_MAX_STASH_ROWS} rows`,
};

export async function fundUpgrade(
  session: PlayerSession,
  track: GuildUpgrade,
  tokens: number,
): Promise<FundResult> {
  const asked = Math.floor(Number(tokens));
  if (!Number.isFinite(asked) || asked <= 0) {
    return { ok: false, status: 400, error: "Say how much you are putting in" };
  }

  const outcome = await firestore.runTransaction(async (tx: Transaction) => {
    const user = await tx.get(userRef(session.uid));
    const guildId = user.data()?.guildId as string | undefined;
    if (!guildId) return { state: "not-in-one" as const };

    const guild = await tx.get(guildRef(guildId));
    if (!guild.exists) return { state: "missing" as const };

    const data = guild.data() ?? {};
    const countField = UPGRADE_COUNT_FIELD[track];
    const upgrades = upgradesBought(track, data[countField]);
    const cost = nextUpgradeCost(track, upgrades);
    if (cost === null) return { state: "maxed" as const };

    // Clamped both ways: what somebody else has already put in is never paid
    // for twice, and a pot that somehow sits at or over the price takes nothing
    // more rather than charging for a step that is already covered.
    const pot = Math.min(
      Math.max(Math.floor(num(data.funds?.[track]?.pot)), 0),
      cost,
    );
    const paid = Math.min(asked, cost - pot);
    if (paid <= 0) return { state: "settled" as const };

    if (!chargeTokens(tx, user, paid)) return { state: "broke" as const };

    const unlocked = pot + paid >= cost;

    tx.update(guildRef(guildId), {
      // Pledges are the credit for the room and outlive every step; the pot is
      // only what is owed on this one, so buying empties it.
      [`funds.${track}.pledges.${session.uid}`]: FieldValue.increment(paid),
      ...(unlocked
        ? { [countField]: upgrades + 1, [`funds.${track}.pot`]: 0 }
        : { [`funds.${track}.pot`]: FieldValue.increment(paid) }),
    });

    return { state: "ok" as const, paid, unlocked };
  });

  if (outcome.state === "not-in-one") {
    return { ok: false, status: 400, error: "You are not in a guild" };
  }
  if (outcome.state === "missing") {
    return { ok: false, status: 404, error: "That guild is gone" };
  }
  if (outcome.state === "maxed") {
    return { ok: false, status: 409, error: MAXED[track] };
  }
  if (outcome.state === "settled") {
    return { ok: false, status: 409, error: "That one is already paid for" };
  }
  if (outcome.state === "broke") {
    return {
      ok: false,
      status: 402,
      error: "Not enough tokens left for that",
    };
  }

  return { ok: true, paid: outcome.paid, unlocked: outcome.unlocked };
}
