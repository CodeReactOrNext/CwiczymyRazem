import type { PedalboardPlacement } from "feature/arsenal/types/arsenal.types";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, items } = req.body as { idToken: string; items: PedalboardPlacement[] };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!Array.isArray(items)) return res.status(400).json({ error: "Missing items" });

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userRef = firestore.collection("users").doc(userId);
    await userRef.update({ "arsenal.rig.pedalboardItems": items });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[update-pedalboard]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
