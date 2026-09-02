import {
  SUPPORT_TEAM_COLLECTION,
  SUPPORT_TEAM_DOC_ID,
} from "feature/supportTeam/constants/supportTeam.constants";
import type {
  PendingSupporter,
  SupportTeamMember,
} from "feature/supportTeam/types/supportTeam.types";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { auth, firestore } from "utils/firebase/api/firebase.config";

import {
  emailFromPendingDocId,
  emailQueryVariants,
  normalizeEmail,
  PENDING_SUPPORTER_COLLECTION,
  pendingSupporterDocId,
} from "./supporterEmail";

/**
 * Turning a Buy Me a Coffee donation into the supporter badge, without anyone
 * opening the admin panel.
 *
 * Two entry points, because the donation and the account rarely show up in the
 * same order:
 *  - `grantSupporterByEmail` runs from the BMC webhook. If the email already
 *    belongs to an account, the badge is on within seconds.
 *  - `claimPendingSupporter` runs on login. It picks up donations made before
 *    the person signed up (or from an account that was logged out at the time),
 *    which sat waiting in `bmcPendingSupporters`.
 *
 * The badge is never taken away here — a cancelled subscription doesn't undo
 * the money already given. Removing one stays a manual call in /admin/users.
 *
 * Both paths also keep `supportTotal` on the user document: the lifetime sum in
 * USD, which is what the supporter panel turns into roadmap votes and credits.
 */

/** Donation amount as a whole, sane number of dollars — Firestore gets nothing else. */
const safeAmount = (amount?: number | null): number =>
  typeof amount === "number" && Number.isFinite(amount) && amount > 0
    ? amount
    : 0;

export type GrantOutcome =
  | { status: "granted"; uid: string }
  | { status: "already"; uid: string }
  | { status: "pending"; email: string }
  | { status: "skipped" };

export type ClaimOutcome = "granted" | "none" | "mismatch" | "skipped";

const toMember = (doc: DocumentSnapshot): SupportTeamMember => {
  const data = doc.data() ?? {};
  return {
    uid: doc.id,
    displayName: data.displayName ?? "Unknown",
    avatar: data.avatar ?? null,
    title: data.supportTitle ?? null,
    lvl: typeof data.statistics?.lvl === "number" ? data.statistics.lvl : null,
  };
};

const byDisplayName = (a: SupportTeamMember, b: SupportTeamMember): number =>
  a.displayName.localeCompare(b.displayName);

/** Every user currently carrying the flag, alphabetically. */
export async function getFlaggedMembers(): Promise<SupportTeamMember[]> {
  const snap = await firestore
    .collection("users")
    .where("isSupport", "==", true)
    .get();

  return (snap.docs as DocumentSnapshot[]).map(toMember).sort(byDisplayName);
}

/**
 * Reads every flagged user and rewrites the public roster document in one go.
 * Clients can't read other people's user documents, so this denormalised copy
 * is the only way the feed and the presence list learn who to mark.
 */
export async function rebuildSupportRoster(): Promise<SupportTeamMember[]> {
  const members = await getFlaggedMembers();

  await firestore
    .collection(SUPPORT_TEAM_COLLECTION)
    .doc(SUPPORT_TEAM_DOC_ID)
    .set({ members, updatedAt: FieldValue.serverTimestamp() });

  return members;
}

/** First account whose stored email matches, trying both casings. */
async function findUserByEmail(
  email?: string | null,
): Promise<DocumentSnapshot | null> {
  for (const variant of emailQueryVariants(email)) {
    const snap = await firestore
      .collection("users")
      .where("email", "==", variant)
      .limit(1)
      .get();

    if (!snap.empty) return snap.docs[0] as DocumentSnapshot;
  }

  return null;
}

const pendingRef = (normalizedEmail: string) =>
  firestore
    .collection(PENDING_SUPPORTER_COLLECTION)
    .doc(pendingSupporterDocId(normalizedEmail));

/**
 * Marks the account behind a donation as a supporter. When no account carries
 * that email yet, the donation is parked instead and picked up by
 * `claimPendingSupporter` the first time that person logs in.
 */
export async function grantSupporterByEmail(donation: {
  email?: string | null;
  supporterName?: string | null;
  amount?: number | null;
}): Promise<GrantOutcome> {
  const normalized = normalizeEmail(donation.email);
  // BMC omits the address for anonymous donations — nothing to match on.
  if (!normalized) return { status: "skipped" };

  const user = await findUserByEmail(donation.email);

  const amount = safeAmount(donation.amount);

  if (!user) {
    // Donating twice before signing up has to add up, so the amount accrues
    // rather than being overwritten by the latest coffee.
    await pendingRef(normalized).set(
      {
        email: normalized,
        supporterName: donation.supporterName ?? null,
        amount: FieldValue.increment(amount),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return { status: "pending", email: normalized };
  }

  const alreadySupporter = user.data()?.isSupport === true;

  // No supportTitle: the generic "Supporter" label is the default, and a custom
  // one set in the admin panel shouldn't be overwritten by the next donation.
  await user.ref.update({
    isSupport: true,
    supportTotal: FieldValue.increment(amount),
  });

  // A repeat donation still tops up the total above, but the roster already
  // lists them — no need to rewrite it.
  if (alreadySupporter) return { status: "already", uid: user.id };

  await rebuildSupportRoster();
  return { status: "granted", uid: user.id };
}

/** The account's address according to Firebase Auth, not according to the caller. */
async function getVerifiedEmail(uid: string): Promise<string | null> {
  try {
    const record = await auth.getUser(uid);
    return normalizeEmail(record?.email);
  } catch {
    return null;
  }
}

/**
 * Hands the badge to a freshly seen account whose email has a donation waiting.
 *
 * `claimedEmail` only decides whether there is anything to look up — the grant
 * itself is gated on the address Firebase Auth has for that uid, so a forged
 * request body can't claim someone else's donation.
 */
export async function claimPendingSupporter(
  uid: string,
  claimedEmail?: string | null,
): Promise<ClaimOutcome> {
  const normalized = normalizeEmail(claimedEmail);
  if (!uid || !normalized) return "skipped";

  const ref = pendingRef(normalized);
  const parked = await ref.get();
  if (!parked.exists) return "none";

  if ((await getVerifiedEmail(uid)) !== normalized) return "mismatch";

  await firestore
    .collection("users")
    .doc(uid)
    .update({
      isSupport: true,
      // What they gave before the account existed still buys roadmap votes.
      supportTotal: FieldValue.increment(safeAmount(parked.data()?.amount)),
    });
  await ref.delete();
  await rebuildSupportRoster();

  return "granted";
}

/** Donations still waiting for an account, newest first — shown in /admin/users. */
export async function listPendingSupporters(): Promise<PendingSupporter[]> {
  const snap = await firestore.collection(PENDING_SUPPORTER_COLLECTION).get();

  return (snap.docs as DocumentSnapshot[])
    .map((doc) => {
      const data = doc.data() ?? {};
      const createdAt = data.createdAt?.toDate?.() ?? null;
      return {
        email: data.email ?? emailFromPendingDocId(doc.id),
        supporterName: data.supporterName ?? null,
        amount: typeof data.amount === "number" ? data.amount : null,
        createdAt: createdAt ? createdAt.toISOString() : null,
      };
    })
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

/** Drops a parked donation — for a typo'd address, or one granted by hand. */
export async function removePendingSupporter(
  email?: string | null,
): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  await pendingRef(normalized).delete();
  return true;
}
