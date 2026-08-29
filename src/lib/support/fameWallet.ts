import type { DocumentSnapshot, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Spending Fame, server-side, inside somebody else's transaction.
 *
 * The counterpart to `chargeTokens` in `tokenWallet.ts`, and deliberately the
 * same contract: it reads the *stored* balance rather than anything the client
 * sent, and when the balance cannot cover the cost it returns false having
 * written nothing, so the caller aborts instead of half-applying whatever it
 * was doing.
 *
 * Fame is earned by practising and is the Arsenal's currency, so the seventeen
 * routes that already spend it each carry their own copy of `read, compare,
 * subtract`. This is that, once. New spenders should use it; the existing ones
 * can move over when they are next touched.
 */

const FAME_FIELD = "statistics.fame";

export const readFame = (data: Record<string, any> | undefined): number => {
  const fame = data?.statistics?.fame;
  return typeof fame === "number" && Number.isFinite(fame) ? fame : 0;
};

/**
 * Charges the user inside an open transaction.
 *
 * A cost that is not a positive whole number is refused rather than rounded:
 * every caller here prices from a catalog constant, so a fractional or negative
 * cost means a bug upstream, and the one thing it must never do is quietly
 * credit Fame instead of taking it.
 */
export const chargeFame = (
  tx: Transaction,
  user: DocumentSnapshot,
  cost: number,
): boolean => {
  if (!Number.isInteger(cost) || cost < 0) return false;

  const balance = readFame(user.data());
  if (balance < cost) return false;

  // Skipped entirely when something free is being "bought", so a zero-cost
  // catalog item does not write a no-op to the user document on every claim.
  if (cost > 0) tx.update(user.ref, { [FAME_FIELD]: balance - cost });
  return true;
};

/**
 * Pays the user inside an open transaction — the counterpart to `chargeFame`.
 *
 * Written as an increment rather than as `balance + reward`, which is the one
 * place the two differ. A charge has to compare against the stored balance to
 * refuse an overdraft, so it may as well write the number it just worked out; a
 * reward has nothing to refuse, and an increment is the safer write to leave in
 * a transaction that may be retried.
 *
 * A reward that is not a positive whole number writes nothing, so a mispriced
 * catalog entry can never quietly take Fame away instead of giving it.
 */
export const awardFame = (
  tx: Transaction,
  user: DocumentSnapshot,
  reward: number,
): boolean => {
  if (!Number.isInteger(reward) || reward <= 0) return false;

  tx.update(user.ref, { [FAME_FIELD]: FieldValue.increment(reward) });
  return true;
};
