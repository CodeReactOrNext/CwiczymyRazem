import type { DocumentSnapshot } from "firebase-admin/firestore";
import type { NextApiRequest } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/** The signed-in supporter behind a request, resolved from their id token. */
export interface SupporterSession {
  uid: string;
  /** Lifetime USD donated. 0 for a supporter marked by hand in the admin panel. */
  supportTotal: number;
  displayName: string;
  avatar: string | null;
  /** Only the project owner may move an idea's status. */
  isOwner: boolean;
}

/** Any signed-in player, supporter or not — the community goal is for everyone. */
export interface PlayerSession extends SupporterSession {
  isSupporter: boolean;
}

export type PlayerAuthResult =
  | { ok: true; session: PlayerSession }
  | { ok: false; status: 401; error: string };

export type SupporterAuthResult =
  | { ok: true; session: SupporterSession }
  | { ok: false; status: 401 | 403; error: string };

const num = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

/**
 * Resolves whoever is behind the request from their id token, plus the parts of
 * their user document these routes act on. Nothing here is taken from the
 * request body beyond the token itself: the badge and the donation total are
 * Admin-SDK-written fields, and the whole economy rests on the client not
 * getting a vote on either.
 *
 * The wallet is deliberately absent — spending re-reads it inside a
 * transaction, so a copy taken here could only ever be stale.
 */
export async function requirePlayer(
  req: NextApiRequest,
): Promise<PlayerAuthResult> {
  const { idToken } = (req.body ?? {}) as { idToken?: string };
  if (!idToken) return { ok: false, status: 401, error: "Unauthorized" };

  let uid: string;
  try {
    uid = (await auth.verifyIdToken(idToken)).uid;
  } catch {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const doc: DocumentSnapshot = await firestore
    .collection("users")
    .doc(uid)
    .get();
  const data = doc.data() ?? {};

  return {
    ok: true,
    session: {
      uid,
      supportTotal: num(data.supportTotal),
      displayName: data.displayName ?? "Player",
      avatar: data.avatar ?? null,
      isOwner: data.role === "admin",
      isSupporter: Boolean(data.isSupport),
    },
  };
}

/** Guards the supporter-only routes. The badge is the ticket. */
export async function requireSupporter(
  req: NextApiRequest,
): Promise<SupporterAuthResult> {
  const result = await requirePlayer(req);
  if (!result.ok) return result;

  if (!result.session.isSupporter) {
    return { ok: false, status: 403, error: "Supporters only" };
  }

  return { ok: true, session: result.session };
}
