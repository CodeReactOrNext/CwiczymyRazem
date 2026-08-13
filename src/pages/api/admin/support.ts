import {
  SUPPORT_TEAM_COLLECTION,
  SUPPORT_TEAM_DOC_ID,
} from "feature/supportTeam/constants/supportTeam.constants";
import type { SupportTeamMember } from "feature/supportTeam/types/supportTeam.types";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "utils/firebase/api/firebase.config";

const SEARCH_LIMIT = 20;
/** Highest code point Firestore sorts, i.e. "everything starting with X". */
const PREFIX_END = "\uf8ff";

function isAuthorized(req: NextApiRequest): boolean {
  const password = req.headers["x-admin-password"] ?? req.body?.password;
  return (
    !!process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD
  );
}

const toMember = (doc: DocumentSnapshot): SupportTeamMember => {
  const data = doc.data() ?? {};
  return {
    uid: doc.id,
    displayName: data.displayName ?? "Unknown",
    avatar: data.avatar ?? null,
    title: data.supportTitle ?? null,
  };
};

const byDisplayName = (a: SupportTeamMember, b: SupportTeamMember): number =>
  a.displayName.localeCompare(b.displayName);

/** Every user currently carrying the flag, alphabetically. */
async function getFlaggedMembers(): Promise<SupportTeamMember[]> {
  const snap = await firestore
    .collection("users")
    .where("isSupport", "==", true)
    .get();

  return (snap.docs as DocumentSnapshot[]).map(toMember).sort(byDisplayName);
}

/** Reads every flagged user and rewrites the public roster document in one go. */
async function rebuildRoster(): Promise<SupportTeamMember[]> {
  const members = await getFlaggedMembers();

  await firestore
    .collection(SUPPORT_TEAM_COLLECTION)
    .doc(SUPPORT_TEAM_DOC_ID)
    .set({ members, updatedAt: FieldValue.serverTimestamp() });

  return members;
}

/**
 * Prefix search over displayName. Firestore range queries are case sensitive,
 * so the raw term and its capitalised form are both tried — enough to find
 * people typed as "jenny" or "Jenny" without a separate search index.
 */
async function searchUsers(term: string): Promise<SupportTeamMember[]> {
  const usersRef = firestore.collection("users");

  const byId = await usersRef.doc(term).get();

  const variants = [
    ...new Set([term, term.charAt(0).toUpperCase() + term.slice(1)]),
  ];
  const snaps = await Promise.all(
    variants.map((variant) =>
      usersRef
        .orderBy("displayName")
        .startAt(variant)
        .endAt(`${variant}${PREFIX_END}`)
        .limit(SEARCH_LIMIT)
        .get(),
    ),
  );

  const found = new Map<string, SupportTeamMember>();
  if (byId.exists) found.set(byId.id, toMember(byId));
  (snaps as { docs: DocumentSnapshot[] }[]).forEach((snap) =>
    snap.docs.forEach((doc) => found.set(doc.id, toMember(doc))),
  );

  return [...found.values()].slice(0, SEARCH_LIMIT);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // ── GET – current roster, or a user search when ?q= is given ──────────────
    if (req.method === "GET") {
      const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

      if (q) {
        const [results, flagged] = await Promise.all([
          searchUsers(q),
          getFlaggedMembers(),
        ]);
        const flaggedIds = new Set(flagged.map((member) => member.uid));

        return res.status(200).json({
          results: results.map((user) => ({
            ...user,
            isSupport: flaggedIds.has(user.uid),
          })),
        });
      }

      return res.status(200).json({ members: await getFlaggedMembers() });
    }

    // ── POST – mark a user as support (or update their title) ─────────────────
    if (req.method === "POST") {
      const { uid, title } = req.body as { uid?: string; title?: string };
      if (!uid) return res.status(400).json({ error: "uid required" });

      const userRef = firestore.collection("users").doc(uid);
      if (!(await userRef.get()).exists) {
        return res.status(404).json({ error: "User not found" });
      }

      await userRef.update({
        isSupport: true,
        supportTitle: title?.trim() ? title.trim() : FieldValue.delete(),
      });

      return res.status(200).json({ members: await rebuildRoster() });
    }

    // ── DELETE – remove a user from the support team ──────────────────────────
    if (req.method === "DELETE") {
      const { uid } = req.body as { uid?: string };
      if (!uid) return res.status(400).json({ error: "uid required" });

      await firestore.collection("users").doc(uid).update({
        isSupport: FieldValue.delete(),
        supportTitle: FieldValue.delete(),
      });

      return res.status(200).json({ members: await rebuildRoster() });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("[admin/support]", error);
    return res.status(500).json({ error: error?.message ?? "Unknown error" });
  }
}
