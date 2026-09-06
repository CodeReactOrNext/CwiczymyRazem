import { honorForFame } from "feature/guilds/utils/guildHonor.utils";
import { GUILD_DEPOSIT_MIN } from "feature/guilds/utils/guildTreasury.utils";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { chargeFame } from "lib/support/fameWallet";
import type { PlayerSession } from "lib/support/supporterAuth";
import { userRef } from "lib/support/tokenWallet";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * The guild's own Fame: putting it in.
 *
 * *Any* member may put Fame in, because a treasury only one person can fill is
 * a treasury nobody else has a reason to care about — the same argument that
 * lets any member buy the guild's colours. Nothing takes it out any more: the
 * ladder of purchasable weeks it used to pay for is gone, and what the treasury
 * is now is one of the things the guild's quests count. What went in, and who
 * put it there, is the record that matters.
 *
 * Nothing comes from the request beyond "how much". Which guild is the caller's
 * own `guildId`, an Admin-SDK-written field, and the balance is read from the
 * stored document, never from anything the client sent — the same rules the
 * cosmetics shop and the seat pots run on.
 */

const GUILDS = "guilds";

const guildRef = (id: string): DocumentReference =>
  firestore.collection(GUILDS).doc(id);

export type TreasuryResult<T> =
  | ({ ok: true } & T)
  | { ok: false; status: 400 | 402 | 403 | 404 | 409; error: string };

/**
 * Puts one member's Fame into the guild's.
 *
 * Charged with `chargeFame`, which reads the stored balance and writes nothing
 * when it cannot cover the amount, so an overdraft aborts the whole deposit
 * rather than crediting a guild out of thin air.
 */
export async function depositFame(
  session: PlayerSession,
  amount: unknown,
): Promise<TreasuryResult<{ paid: number }>> {
  const asked = Math.floor(Number(amount));
  if (!Number.isFinite(asked) || asked < GUILD_DEPOSIT_MIN) {
    return { ok: false, status: 400, error: "Say how much you are putting in" };
  }

  const outcome = await firestore.runTransaction(async (tx: Transaction) => {
    const user = await tx.get(userRef(session.uid));
    const guildId = user.data()?.guildId as string | undefined;
    if (!guildId) return { state: "not-in-one" as const };

    const guild = await tx.get(guildRef(guildId));
    if (!guild.exists) return { state: "missing" as const };

    if (!chargeFame(tx, user, asked)) return { state: "broke" as const };

    tx.update(guildRef(guildId), {
      "treasury.fame": FieldValue.increment(asked),
      // The credit for it, which is what the quests count.
      [`treasury.deposits.${session.uid}`]: FieldValue.increment(asked),
      // And the receipt: honor, the guild's own currency, to take gear off the
      // shelf with. See `guildHonor.utils.ts`.
      [`honor.${session.uid}.earned`]: FieldValue.increment(
        honorForFame(asked),
      ),
    });

    return { state: "ok" as const };
  });

  if (outcome.state === "not-in-one") {
    return { ok: false, status: 400, error: "You are not in a guild" };
  }
  if (outcome.state === "missing") {
    return { ok: false, status: 404, error: "That guild is gone" };
  }
  if (outcome.state === "broke") {
    return { ok: false, status: 402, error: "You do not have that much Fame" };
  }

  return { ok: true, paid: asked };
}
