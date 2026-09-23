import { getUserRoadmap, listUserRoadmaps } from "lib/roadmaps/userRoadmaps";
import { requireSupporter } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Every player's roadmap, read-only, for supporters — the same bar as the rest
 * of the panel. Names and goals travel with the rows; uids do not, since
 * nothing on the board needs them to be readable.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authResult = await requireSupporter(req);
  if (!authResult.ok) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  try {
    const { id, userId, progressUid } = (req.body ?? {}) as {
      id?: string;
      userId?: string;
      /** The viewer's own uid, for a roadmap they are following. */
      progressUid?: string;
    };

    if (id) {
      const detail = await getUserRoadmap(
        id,
        userId ?? "",
        authResult.session.uid,
        progressUid,
      );
      if (!detail) return res.status(404).json({ error: "Roadmap not found" });
      return res.status(200).json(detail);
    }

    return res
      .status(200)
      .json({ roadmaps: await listUserRoadmaps(authResult.session.uid) });
  } catch (error: any) {
    console.error("[supporter/user-roadmaps]", error);
    return res.status(500).json({ error: "Failed to load the roadmaps" });
  }
}
