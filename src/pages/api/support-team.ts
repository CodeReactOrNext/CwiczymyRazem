import {
  SUPPORT_TEAM_COLLECTION,
  SUPPORT_TEAM_DOC_ID,
} from "feature/supportTeam/constants/supportTeam.constants";
import type { SupportTeamMember } from "feature/supportTeam/types/supportTeam.types";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "utils/firebase/api/firebase.config";

/** How many user documents are read in one `getAll` call. */
const PROFILE_BATCH = 100;

/**
 * Names, avatars and levels as they are *now*, rather than as they were the day
 * the roster was last rewritten — the roster document is only rebuilt when
 * somebody joins or leaves it, so a supporter who levelled up since would be
 * honoured with a level from months ago.
 *
 * Only the supporter wall pays for this (`?levels=1`); the badge lookup every
 * page makes keeps reading the single denormalised document.
 */
async function withCurrentProfiles(
  members: SupportTeamMember[],
): Promise<SupportTeamMember[]> {
  const usersRef = firestore.collection("users");
  const fresh = new Map<string, Partial<SupportTeamMember>>();

  for (let start = 0; start < members.length; start += PROFILE_BATCH) {
    const batch = members.slice(start, start + PROFILE_BATCH);
    const docs = (await firestore.getAll(
      ...batch.map((member) => usersRef.doc(member.uid)),
    )) as DocumentSnapshot[];

    docs.forEach((doc) => {
      if (!doc.exists) return;
      const data = doc.data() ?? {};
      fresh.set(doc.id, {
        displayName: data.displayName ?? undefined,
        avatar: data.avatar ?? null,
        title: data.supportTitle ?? null,
        lvl:
          typeof data.statistics?.lvl === "number" ? data.statistics.lvl : null,
      });
    });
  }

  // A member whose document could not be read keeps whatever the roster stored.
  return members.map((member) => ({ ...member, ...fresh.get(member.uid) }));
}

/**
 * Public roster of supporters, used to mark their avatars in the
 * activity feed and the "Live Now" list. Served from a single denormalised
 * document (written by /api/admin/support) so the client pays one request
 * instead of a per-user lookup it is not even allowed to make.
 *
 * With `?levels=1` the roster is enriched from the user documents, which is
 * what the supporter wall lists people by.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const snap = await firestore
      .collection(SUPPORT_TEAM_COLLECTION)
      .doc(SUPPORT_TEAM_DOC_ID)
      .get();

    const stored = (snap.data()?.members ?? []) as SupportTeamMember[];

    const members =
      req.query.levels === "1" && stored.length
        ? await withCurrentProfiles(stored)
        : stored;

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=3600",
    );
    return res.status(200).json({ members });
  } catch (error) {
    console.error("[support-team] Failed to read roster:", error);
    return res.status(200).json({ members: [] });
  }
}
