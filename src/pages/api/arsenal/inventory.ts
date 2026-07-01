import { getRigLevel } from "feature/arsenal/data/rigLevel";
import type { ArsenalUserData } from "feature/arsenal/types/arsenal.types";
import { DEFAULT_RIG } from "feature/arsenal/types/arsenal.types";
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
        equippedItemId: null,
        rig: DEFAULT_RIG,
        effectInventory: [],
      };
      await userRef.update({ arsenal, rigLevel: 0 });
      return res.status(200).json({ ...arsenal, fame });
    }

    const storedRig = data.arsenal.rig;
    const inventory: ArsenalUserData["inventory"] = data.arsenal.inventory || [];
    const equippedGuitarId = data.arsenal.equippedGuitarId ?? null;
    // Migrate older accounts that tracked the equipped guitar only by guitarId:
    // resolve to the first matching inventory item so exactly one copy is marked equipped.
    const equippedItemId =
      data.arsenal.equippedItemId ??
      (equippedGuitarId != null
        ? inventory.find((item) => item.guitarId === equippedGuitarId)?.id ?? null
        : null);
    const arsenal: ArsenalUserData = {
      inventory,
      equippedGuitarId,
      equippedItemId,
      rig: {
        guitarSlots: storedRig?.guitarSlots ?? DEFAULT_RIG.guitarSlots,
        pedalboardItems: Array.isArray(storedRig?.pedalboardItems)
          ? storedRig.pedalboardItems
          : DEFAULT_RIG.pedalboardItems,
        ampHeadId: storedRig?.ampHeadId ?? null,
        ampId: storedRig?.ampId ?? null,
      },
      effectInventory: data.arsenal.effectInventory || [],
    };

    // Reconcile the denormalized rig level (backfills old accounts, self-heals
    // after gear-balance changes in itemStats/effectStats).
    const computedRigLevel = getRigLevel(arsenal);
    if (data.rigLevel !== computedRigLevel) {
      await userRef.update({ rigLevel: computedRigLevel });
    }

    return res.status(200).json({ ...arsenal, fame });
  } catch (error) {
    console.error("[inventory]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
