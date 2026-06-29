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

    // Clear the profile/avatar guitar — leaves rig slots untouched.
    await userRef.update({
      "arsenal.equippedGuitarId": null,
      "arsenal.equippedItemId": null,
      selectedGuitar: null,
      selectedGuitarYear: null,
      selectedGuitarCountry: null,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[unequip-guitar]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
