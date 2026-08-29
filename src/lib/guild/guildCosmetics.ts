import { findCosmetic } from "feature/guilds/data/guildCosmetics";
import {
  canEquip,
  COSMETIC_PROBLEM_MESSAGES,
  readCosmetics,
} from "feature/guilds/utils/guildCosmetics.utils";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { syncGuildBadges } from "lib/guild/guildBadge";
import type { PlayerSession } from "lib/support/supporterAuth";
import { userRef } from "lib/support/tokenWallet";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * Wearing a guild's kit.
 *
 * One rule decides everything: the founder changes what the guild wears, and it
 * costs nothing. Free, because a look pays nothing back and charging for one
 * only kept guilds in the default; founder-only, because with a free change and
 * no owner, two members with different taste could flip the guild's colour back
 * and forth all afternoon at no cost to either.
 *
 * Which guild is changed comes from the caller's own `guildId`, an
 * Admin-SDK-only field, never from the request body — the same rule the seat
 * upgrades run on.
 */

const GUILDS = "guilds";

const guildRef = (id: string): DocumentReference =>
  firestore.collection(GUILDS).doc(id);

export type CosmeticResult =
  | { ok: true }
  | { ok: false; status: 400 | 403 | 404 | 409; error: string };

type Outcome =
  | "ok"
  | "not-in-one"
  | "missing"
  | "unknown"
  | "already-worn"
  | "not-founder";

const REFUSALS: Record<
  Exclude<Outcome, "ok">,
  { status: 400 | 403 | 404 | 409; error: string }
> = {
  "not-in-one": { status: 400, error: "You are not in a guild" },
  missing: { status: 404, error: "That guild is gone" },
  unknown: { status: 400, error: COSMETIC_PROBLEM_MESSAGES.unknown },
  "already-worn": {
    status: 409,
    error: COSMETIC_PROBLEM_MESSAGES["already-worn"],
  },
  "not-founder": {
    status: 403,
    error: "Only the founder changes what the guild wears",
  },
};

const settle = (outcome: Outcome): CosmeticResult =>
  outcome === "ok" ? { ok: true } : { ok: false, ...REFUSALS[outcome] };

/**
 * What the transaction hands back. The guild's id travels with the outcome so
 * the badge re-stamp afterwards does not have to re-read the user document to
 * find out which guild it just changed.
 */
type Settled = { outcome: Outcome; guildId?: string };

/** Puts on any item in the catalog. Free, and the founder's call. */
export async function equipCosmetic(
  session: PlayerSession,
  itemId: unknown,
): Promise<CosmeticResult> {
  const item = findCosmetic(itemId);
  if (!item) return settle("unknown");

  const { outcome, guildId } = await firestore.runTransaction(
    async (tx: Transaction): Promise<Settled> => {
      const user = await tx.get(userRef(session.uid));
      const id = user.data()?.guildId as string | undefined;
      if (!id) return { outcome: "not-in-one" };

      const guild = await tx.get(guildRef(id));
      if (!guild.exists) return { outcome: "missing" };

      const data = guild.data() ?? {};
      if (data.founderUid !== session.uid) return { outcome: "not-founder" };

      const cosmetics = readCosmetics(data.cosmetics);
      const problem = canEquip(cosmetics, item.id);
      if (problem) return { outcome: problem };

      // The whole object rather than a `cosmetics.accent` field path: the
      // transaction has just read it, a concurrent write makes the transaction
      // retry rather than clobber, and writing it entire is also what drops the
      // `unlocked`/`funders` leftovers from the days the kit was paid for.
      tx.update(guildRef(id), {
        cosmetics: { ...cosmetics, [item.slot]: item.id },
      });

      return { outcome: "ok", guildId: id };
    },
  );

  if (outcome !== "ok" || !guildId) return settle(outcome);

  // The change is committed by here; the roster's badges are catching up.
  await syncGuildBadges(guildId);

  return { ok: true };
}
