import { logger } from "feature/logger/Logger";
import * as admin from "firebase-admin";
import { firestore } from "utils/firebase/api/firebase.config";

/** Shape the roadmap hook (and the support-ask feed card) expects. */
export interface FundingResponse {
  totalRaised: number;
  supporters: number;
  /** Raised since the start of the current month (UTC) — covers running costs. */
  raisedThisMonth: number;
}

/** Clean baseline used before any data exists (or if Firestore is unreachable). */
const FALLBACK: FundingResponse = {
  totalRaised: 0,
  supporters: 0,
  raisedThisMonth: 0,
};

/** Epoch seconds for the first instant of the current month (UTC). */
function startOfMonthSec(): number {
  const now = new Date();
  return Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) / 1000
  );
}

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * How many payments a subscription has made between `startSec` and `endSec`:
 * one at signup, then one each anniversary (month or year) that has passed.
 * Returns 0 when the subscription hasn't started yet (future startedAt).
 */
function paymentsMade(
  startSec: number,
  endSec: number,
  durationType: string
): number {
  if (!startSec || endSec < startSec) return 0;
  let count = 1;
  const d = new Date(startSec * 1000);
  // Guard against a runaway loop on bad data.
  for (let i = 0; i < 600; i++) {
    if (durationType === "year") d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    if (d.getTime() / 1000 <= endSec) count++;
    else break;
  }
  return count;
}

/**
 * Aggregates the real Buy Me a Coffee funding numbers from Firestore
 * (`meta/funding`, `bmcRecurring`, `bmcFundingEvents`). Shared by the
 * `/api/buy-me-a-coffee` route (which layers a short HTTP cache on top) and
 * the support-ask Activity feed cron, so both read the same live numbers
 * without one calling the other over HTTP.
 */
export async function getFundingSnapshot(): Promise<FundingResponse> {
  try {
    const nowSec = Math.floor(Date.now() / 1000);
    const monthStartSec = startOfMonthSec();

    // Base: one-off coffees, maintained by /api/bmc-webhook.
    const fundingSnap = await firestore.collection("meta").doc("funding").get();
    const base = fundingSnap.exists ? fundingSnap.data() ?? {} : {};
    let totalRaised = num(base.oneOffTotal);
    let supporters = num(base.oneOffSupporters);
    let raisedThisMonth = 0;

    // Recurring: accrue amount × payments-so-far for every subscription, frozen
    // at endedAt once cancelled/paused. This is what makes the number climb on
    // its own as months pass — no monthly event required.
    const recurring = await firestore.collection("bmcRecurring").get();
    recurring.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const r = doc.data() ?? {};
      const startSec = num(r.startedAt);
      const endSec = r.endedAt ? num(r.endedAt) : nowSec;
      const durationType = String(r.durationType ?? "month");
      const cappedEnd = Math.min(endSec, nowSec);
      const amount = num(r.amount);
      const payments = paymentsMade(startSec, cappedEnd, durationType);
      totalRaised += amount * payments;
      supporters += 1;

      // Payments whose date falls inside the current month.
      const paymentsBeforeMonth = paymentsMade(
        startSec,
        Math.min(cappedEnd, monthStartSec - 1),
        durationType
      );
      raisedThisMonth += amount * (payments - paymentsBeforeMonth);
    });

    // One-off coffees logged this month, summed from the per-event ledger.
    try {
      const monthStartTs = admin.firestore.Timestamp.fromMillis(
        monthStartSec * 1000
      );
      const eventsSnap = await firestore
        .collection("bmcFundingEvents")
        .where("at", ">=", monthStartTs)
        .get();
      eventsSnap.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        raisedThisMonth += num((doc.data() ?? {}).amount);
      });
    } catch (eventsError) {
      // A missing index / unavailable ledger shouldn't break the whole read.
      logger.warn("Failed to read this-month one-off coffees", {
        context: "getFundingSnapshot",
        extra: {
          error:
            eventsError instanceof Error
              ? eventsError.message
              : String(eventsError),
        },
      });
    }

    // Nothing recorded yet → keep callers populated with the fallback.
    const hasData = fundingSnap.exists || recurring.size > 0;
    return hasData
      ? {
          totalRaised: Math.round(totalRaised),
          supporters,
          raisedThisMonth: Math.round(raisedThisMonth),
        }
      : FALLBACK;
  } catch (error) {
    logger.warn("Failed to read Buy Me a Coffee funding", {
      context: "getFundingSnapshot",
      extra: { error: error instanceof Error ? error.message : String(error) },
    });
    return FALLBACK;
  }
}
