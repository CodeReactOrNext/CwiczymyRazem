import { getModResaleValue } from "feature/arsenal/data/resale";
import type { SalvagedMod } from "feature/arsenal/types/arsenal.types";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Sells one rescued mod out of the stash.
 *
 * The payout is recomputed here from the stored mod rather than taken from the
 * request: the client sends only which mod, the same way the workshop routes
 * take only which job.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, modId } = req.body as { idToken: string; modId: string };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!modId) return res.status(400).json({ error: "Missing modId" });

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
    const salvagedMods: SalvagedMod[] = data.arsenal?.salvagedMods || [];

    const mod = salvagedMods.find((entry) => entry.id === modId);
    if (!mod) {
      return res.status(404).json({ error: "Mod not found in stash" });
    }

    const fameReward = getModResaleValue(mod.kind, mod.featureId, mod.points);
    if (fameReward <= 0) {
      return res.status(400).json({ error: "This mod cannot be sold" });
    }

    await userRef.update({
      "arsenal.salvagedMods": salvagedMods.filter(
        (entry) => entry.id !== modId,
      ),
      "statistics.fame": (data.statistics?.fame || 0) + fameReward,
    });

    return res.status(200).json({ success: true, fameReward });
  } catch (error) {
    console.error("[sell-mod]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
