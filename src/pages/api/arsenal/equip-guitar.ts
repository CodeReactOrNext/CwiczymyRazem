import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, guitarId, itemId } = req.body as {
    idToken: string;
    guitarId: number | string;
    itemId?: string;
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
    const inventory: { id: string; guitarId: number | string; year?: number; country?: string }[] = data.arsenal?.inventory || [];

    // Prefer matching the unique inventory item so duplicates of the same guitarId
    // can be equipped independently. Fall back to guitarId for backward compatibility.
    const ownedItem = itemId
      ? inventory.find((item) => item.id === itemId)
      : inventory.find((item) => item.guitarId === guitarId);
    if (!ownedItem) {
      return res.status(403).json({ error: "Guitar not in inventory" });
    }

    const guitarDef = GUITARS_BY_ID.get(ownedItem.guitarId);
    const imageId = guitarDef?.imageId ?? ownedItem.guitarId;

    await userRef.update({
      "arsenal.equippedGuitarId": ownedItem.guitarId,
      "arsenal.equippedItemId": ownedItem.id,
      selectedGuitar: imageId,
      selectedGuitarYear: ownedItem.year ?? null,
      selectedGuitarCountry: ownedItem.country ?? null,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[equip-guitar]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
