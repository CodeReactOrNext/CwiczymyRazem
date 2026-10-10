import type { OwnedComponent } from "feature/guitarBuilder/types/guitarBuilder.types";
import { getComponentResaleValue } from "feature/guitarBuilder/utils/components";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Sells one Guitar Builder part out of the stash.
 *
 * The payout is recomputed here from the stored part rather than taken from
 * the request: the client sends only which part, as with `sell-mod`.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, componentUid } = req.body as {
    idToken: string;
    componentUid: string;
  };
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!componentUid) {
    return res.status(400).json({ error: "Missing componentUid" });
  }

  let userId: string;
  try {
    userId = (await auth.verifyIdToken(idToken)).uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userRef = firestore
      .collection("users")
      .doc(userId) as DocumentReference;
    const fameReward = await firestore.runTransaction(
      async (t: Transaction) => {
        const doc = await t.get(userRef);
        if (!doc.exists) throw new Error("USER_NOT_FOUND");
        const data = doc.data()!;
        const components: OwnedComponent[] = data.arsenal?.components || [];
        const part = components.find((c) => c.uid === componentUid);
        if (!part) throw new Error("NOT_FOUND");
        const reward = getComponentResaleValue(part);
        if (reward <= 0) throw new Error("NOT_SELLABLE");
        t.update(userRef, {
          "arsenal.components": components.filter(
            (c) => c.uid !== componentUid,
          ),
          "statistics.fame": (data.statistics?.fame || 0) + reward,
        });
        return reward;
      },
    );
    return res.status(200).json({ success: true, fameReward });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "USER_NOT_FOUND")
      return res.status(404).json({ error: "User not found" });
    if (code === "NOT_FOUND")
      return res.status(404).json({ error: "Part not found in stash" });
    if (code === "NOT_SELLABLE")
      return res.status(400).json({ error: "This part cannot be sold" });
    console.error("[sell-component]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
