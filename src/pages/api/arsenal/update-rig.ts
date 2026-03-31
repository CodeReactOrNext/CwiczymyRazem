import type { RigSetup } from "feature/arsenal/types/arsenal.types";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, rig, selectedGuitar, selectedGuitarYear, selectedGuitarCountry } = req.body as { idToken: string; rig: RigSetup; selectedGuitar?: string | number | null; selectedGuitarYear?: number; selectedGuitarCountry?: string };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!rig) return res.status(400).json({ error: "Missing rig" });

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userRef = firestore.collection("users").doc(userId);
    const updates: Record<string, unknown> = { "arsenal.rig": rig };
    if (selectedGuitar !== undefined) {
      updates.selectedGuitar = selectedGuitar ?? null;
      updates.selectedGuitarYear = selectedGuitarYear ?? null;
      updates.selectedGuitarCountry = selectedGuitarCountry ?? null;
    }
    await userRef.update(updates);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[update-rig]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
