import { FEATURE_GOAL_IDS } from "feature/whatNext/data/featureGoals";
import {
  payFeatureGoalCases,
  readFeatureGoalCases,
} from "lib/featureGoals/resolveFeatureGoals";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Where the player stands on What Next's "use it once" goals: which are done,
 * and how far to the next free case. A case earned is paid right here, into
 * the stash — there is nothing to collect by hand.
 *
 * Done-ness is worked out here rather than in the browser because the claim
 * route has to work it out anyway before paying — one set of rules, read with
 * the Admin SDK, answers both. Goals found done once are remembered on the
 * ledger and never looked up again, so the cost shrinks with every goal done.
 * The first look also seals the account's baseline: what it had done before
 * the goals existed counts for no case.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken } = req.body as { idToken?: string };
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });

  let userId: string;
  try {
    userId = (await auth.verifyIdToken(idToken)).uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userDoc = await firestore.collection("users").doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });

    const { done, cases } = await readFeatureGoalCases(
      firestore,
      userId,
      userDoc.data()!,
    );

    const paidNow =
      cases.owed > 0 ? await payFeatureGoalCases(firestore, userId, done) : 0;

    return res.status(200).json({
      goals: FEATURE_GOAL_IDS.map((id) => ({ id, done: done.has(id) })),
      cases: {
        ...cases,
        paid: cases.paid + paidNow,
        owed: Math.max(0, cases.owed - paidNow),
      },
      paidNow,
    });
  } catch (error) {
    console.error("[feature-goals/state]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
