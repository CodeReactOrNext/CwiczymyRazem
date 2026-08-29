import {
  nextChallengeTier,
  tierCost,
} from "feature/guilds/data/guildChallengeTiers";
import {
  GUILD_DEPOSIT_MIN,
  readTreasury,
} from "feature/guilds/utils/guildTreasury.utils";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { chargeFame } from "lib/support/fameWallet";
import type { PlayerSession } from "lib/support/supporterAuth";
import { userRef } from "lib/support/tokenWallet";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * The guild's own Fame: putting it in, and spending it.
 *
 * Two acts, two rules, and the split is the whole point. *Any* member may put
 * Fame in, because a treasury only one person can fill is a treasury nobody
 * else has a reason to care about — the same argument that lets any member buy
 * the guild's colours. Only the founder may *spend* it, because spending it is
 * not a gift: buying a challenge tier moves everybody's weekly target up, and a
 * guild where any member could commit the whole roster to six sessions a week
 * with the guild's own money is a guild one member can wreck.
 *
 * Nothing about either act comes from the request beyond "how much". Which
 * guild is the caller's own `guildId`, an Admin-SDK-written field; the price of
 * a tier is read from the catalog inside the transaction; and the balance is
 * read from the stored document, never from anything the client sent — the same
 * rules the cosmetics shop and the seat pots run on.
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
      // The credit for it, which outlives every purchase the balance pays for.
      [`treasury.deposits.${session.uid}`]: FieldValue.increment(asked),
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

/**
 * Moves the guild one step up the challenge ladder, out of its own Fame.
 *
 * Permanent and one-way: there is no selling a tier back, because a week the
 * guild has already been paid for cannot be un-practised. The founder is the
 * one who commits the roster to it.
 */
export async function buyChallengeTier(
  session: PlayerSession,
): Promise<TreasuryResult<{ tier: number; name: string; spent: number }>> {
  const outcome = await firestore.runTransaction(async (tx: Transaction) => {
    const user = await tx.get(userRef(session.uid));
    const guildId = user.data()?.guildId as string | undefined;
    if (!guildId) return { state: "not-in-one" as const };

    const guild = await tx.get(guildRef(guildId));
    if (!guild.exists) return { state: "missing" as const };

    const data = guild.data() ?? {};
    if (data.founderUid !== session.uid)
      return { state: "not-founder" as const };

    const next = nextChallengeTier(data.challengeTier);
    const cost = next ? tierCost(next) : null;
    if (!next || cost === null) return { state: "maxed" as const };

    // Read from the stored document inside the transaction: a concurrent
    // deposit or purchase retries this rather than being spent twice.
    const treasury = readTreasury(data);
    if (treasury.fame < cost) {
      return { state: "short" as const, short: cost - treasury.fame };
    }

    tx.update(guildRef(guildId), {
      // Written as the tier's own id rather than an increment, so a stored
      // count that was somehow out of range is corrected by the purchase
      // instead of carried forward — `challengeTierOf` clamps the read.
      challengeTier: next.id,
      "treasury.fame": FieldValue.increment(-cost),
      "treasury.spent": FieldValue.increment(cost),
    });

    return {
      state: "ok" as const,
      tier: next.id,
      name: next.name,
      spent: cost,
    };
  });

  if (outcome.state === "not-in-one") {
    return { ok: false, status: 400, error: "You are not in a guild" };
  }
  if (outcome.state === "missing") {
    return { ok: false, status: 404, error: "That guild is gone" };
  }
  if (outcome.state === "not-founder") {
    return {
      ok: false,
      status: 403,
      error: "Only the founder spends the guild's Fame",
    };
  }
  if (outcome.state === "maxed") {
    return {
      ok: false,
      status: 409,
      error: "The guild is already on the hardest week there is",
    };
  }
  if (outcome.state === "short") {
    return {
      ok: false,
      status: 402,
      error: `The guild is ${outcome.short} Fame short of that`,
    };
  }

  return {
    ok: true,
    tier: outcome.tier,
    name: outcome.name,
    spent: outcome.spent,
  };
}
