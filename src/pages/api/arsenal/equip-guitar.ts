import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, guitarId } = req.body as {
    idToken: string;
    guitarId: number | string;
  };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (guitarId === undefined || guitarId === null) {
    return res.status(400).json({ error: "Missing guitarId" });
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

    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });

    const data = userDoc.data()!;
    const inventory: { guitarId: number | string }[] = data.arsenal?.inventory || [];

    // Validate ownership
    const owns = inventory.some((item) => item.guitarId === guitarId);
    if (!owns) {
      return res.status(403).json({ error: "Guitar not in inventory" });
    }

    await userRef.update({
      "arsenal.equippedGuitarId": guitarId,
      selectedGuitar: guitarId,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[equip-guitar]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
