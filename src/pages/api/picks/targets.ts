import {
  buildPickTargets,
  PICK_TARGET_SCAN_LIMIT,
  PICKS_PER_DAY,
  picksLeftToday,
  type PickTargetsResponse,
  type PickThrowerRecord,
} from "feature/picks/picks.rules";
import { toStoredLog } from "lib/logs/loadLogGroup";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Who the post-session summary offers a pick to, and how many picks the player has left today.
 * Read with the Admin SDK so the allowance (`pickThrowers`, server-only) and the feed grouping come
 * from the same place `/api/picks/throw` checks them against.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { idToken } = req.body as { idToken?: string };
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });

  let viewerId: string;
  try {
    viewerId = (await auth.verifyIdToken(idToken)).uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const nowMs = Date.now();
    const [limitDoc, logsSnapshot] = await Promise.all([
      firestore.collection("pickThrowers").doc(viewerId).get(),
      firestore
        .collection("logs")
        .orderBy("timestamp", "desc")
        .limit(PICK_TARGET_SCAN_LIMIT)
        .get(),
    ]);

    const picksLeft = picksLeftToday(
      limitDoc.exists ? (limitDoc.data() as PickThrowerRecord) : null,
      nowMs,
    );
    // Nothing to toss, nothing to offer — and no reason to rank the feed for it.
    const targets =
      picksLeft > 0
        ? buildPickTargets({
            logs: logsSnapshot.docs.map(toStoredLog),
            viewerId,
            nowMs,
            hasOlderLogs: logsSnapshot.size >= PICK_TARGET_SCAN_LIMIT,
          })
        : [];

    const body: PickTargetsResponse = {
      picksLeft,
      perDay: PICKS_PER_DAY,
      targets,
    };
    return res.status(200).json(body);
  } catch (error) {
    console.error("[picks/targets]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
