import { getRigLevel } from "feature/arsenal/data/rigLevel";
import type { RigSetup } from "feature/arsenal/types/arsenal.types";
import {
  blockedEquipMessage,
  findBlockedRigChange,
} from "feature/progression/utils/equipGuard";
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
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });

    const data = userDoc.data()!;
    const arsenal = data.arsenal;

    // The rarity ladder, checked against what this write would newly bring in
    // rather than against the whole rig — see `findBlockedRigChange`.
    const blocked =
      data.role === "admin"
        ? null
        : findBlockedRigChange(
            {
              inventory: arsenal?.inventory ?? [],
              effectInventory: arsenal?.effectInventory ?? [],
              rig: arsenal?.rig,
            },
            {
              guitarSlots: rig.guitarSlots,
              pedalboardItemIds: (rig.pedalboardItems ?? []).map(
                (placement) => placement.itemId,
              ),
            },
            data.statistics?.lvl ?? 1,
          );
    if (blocked) {
      return res
        .status(403)
        .json({ error: blockedEquipMessage(blocked), blocked });
    }

    const updates: Record<string, unknown> = {
      "arsenal.rig": rig,
      rigLevel: getRigLevel({
        inventory: arsenal?.inventory ?? [],
        effectInventory: arsenal?.effectInventory ?? [],
        rig,
      }),
    };
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
