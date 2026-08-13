import {
  SUPPORT_TEAM_COLLECTION,
  SUPPORT_TEAM_DOC_ID,
} from "feature/supportTeam/constants/supportTeam.constants";
import type { SupportTeamMember } from "feature/supportTeam/types/supportTeam.types";
import type { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * Public roster of supporters, used to mark their avatars in the
 * activity feed and the "Live Now" list. Served from a single denormalised
 * document (written by /api/admin/support) so the client pays one request
 * instead of a per-user lookup it is not even allowed to make.
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

    const members = (snap.data()?.members ?? []) as SupportTeamMember[];

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
