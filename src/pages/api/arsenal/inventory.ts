import type { ArsenalUserData } from "feature/arsenal/types/arsenal.types";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken } = req.body as { idToken: string };
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });

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

    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });

    const data = userDoc.data()!;
    const fame: number = data.statistics?.fame || 0;

    if (!data.arsenal) {
      // Starter migration: initialize arsenal
      const equippedGuitarId = data.selectedGuitar ?? null;
      const arsenal: ArsenalUserData = {
        inventory: [],
        equippedGuitarId,
      };
      await userRef.update({ arsenal });
      return res.status(200).json({ ...arsenal, fame });
    }

    const arsenal: ArsenalUserData = {
      inventory: data.arsenal.inventory || [],
      equippedGuitarId: data.arsenal.equippedGuitarId ?? null,
    };

    return res.status(200).json({ ...arsenal, fame });
  } catch (error) {
    console.error("[inventory]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
