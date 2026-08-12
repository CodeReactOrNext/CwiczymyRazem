import { getPartResaleValue } from "feature/arsenal/data/resale";
import { subtractParts } from "feature/arsenal/data/workshop";
import type {
  PartId,
  PartTier,
  ScrapPart,
} from "feature/arsenal/types/arsenal.types";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Sells loose parts out of the stash, one stack at a time.
 *
 * The quantity is the only thing the client gets a say in, and it is checked
 * against the wallet before anything is paid: the price itself is recomputed
 * here from `resale.ts`.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, partId, tier, qty } = req.body as {
    idToken: string;
    partId: PartId;
    tier: PartTier;
    qty: number;
  };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!partId || !tier) {
    return res.status(400).json({ error: "Missing part" });
  }

  const wanted = Math.floor(Number(qty));
  if (!Number.isFinite(wanted) || wanted <= 0) {
    return res.status(400).json({ error: "Invalid quantity" });
  }

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userRef = firestore.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const data = userDoc.data()!;
    const wallet: ScrapPart[] = data.arsenal?.parts || [];

    const held = wallet
      .filter((part) => part.partId === partId && part.tier === tier)
      .reduce((total, part) => total + part.qty, 0);

    if (held < wanted) {
      return res.status(400).json({ error: "Not enough parts to sell" });
    }

    const fameReward = getPartResaleValue(partId, tier, wanted);
    if (fameReward <= 0) {
      return res.status(400).json({ error: "This part cannot be sold" });
    }

    const newParts = subtractParts(wallet, [{ partId, tier, qty: wanted }]);

    await userRef.update({
      "arsenal.parts": newParts,
      "statistics.fame": (data.statistics?.fame || 0) + fameReward,
    });

    return res.status(200).json({ success: true, fameReward, newParts });
  } catch (error) {
    console.error("[sell-part]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
