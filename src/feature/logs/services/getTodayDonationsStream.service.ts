import { MAX_DAILY_DONATIONS } from "feature/logs/utils/activityFame";
import type { AnyFirebaseLog } from "feature/logs/utils/groupConsecutiveLogs";
import { pinnedDonationsSince } from "feature/logs/utils/pinnedDonations";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

/**
 * The day's donations, streamed on their own instead of being picked out of the feed page.
 *
 * The feed reads the newest 20 logs, which on a busy afternoon covers about twenty minutes — a
 * coffee bought in the morning is long past that window, and a card the page never fetched can't
 * be pinned to the top of it. This query is bounded by the day rather than by a row count, so the
 * donation stays up for as long as it's supposed to.
 *
 * Capped at the number of donations the feed pins anyway: past the day's fourth nothing more is
 * shown, so there's no reason to stream them.
 *
 * Needs a composite index on `logs` — `type` ascending, `timestamp` descending. Without it the
 * query fails and the feed simply falls back to what the main stream fetched, which is how it
 * behaved before this existed.
 */
export const firebaseGetTodayDonationsStream = (
  callback: (logs: AnyFirebaseLog[]) => void,
  now: Date = new Date(),
) => {
  const todayDonations = query(
    collection(db, "logs"),
    where("type", "==", "donation_received"),
    where("timestamp", ">=", pinnedDonationsSince(now)),
    orderBy("timestamp", "desc"),
    limit(MAX_DAILY_DONATIONS),
  );

  return onSnapshot(
    todayDonations,
    (snapshot) => {
      callback(
        snapshot.docs.map(
          (doc) => ({ ...doc.data(), id: doc.id }) as AnyFirebaseLog,
        ),
      );
    },
    (error) => {
      // A pinned card is a bonus, not the feed — if this query is unavailable (a missing composite
      // index is the likely reason) the page keeps rendering whatever the main stream returned.
      console.error("Today's donations listener failed:", error);
      callback([]);
    },
  );
};
