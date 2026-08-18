import { getRigLevel } from "feature/arsenal/data/rigLevel";
import type { ArsenalUserData } from "feature/arsenal/types/arsenal.types";
import { DEFAULT_RIG } from "feature/arsenal/types/arsenal.types";
import { buildDiscoveredSet } from "feature/arsenal/utils/dex";
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
        parts: [],
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
    const effectInventory: ArsenalUserData["effectInventory"] =
      data.arsenal.effectInventory || [];

    // Discovery is a record of everything the account has ever held, not a
    // snapshot of the stash — selling a guitar must not un-discover it. Accounts
    // that predate the record have none, so it is seeded from what they own now.
    const discoveredGuitars = buildDiscoveredSet(
      data.arsenal.dexGuitars,
      inventory,
      (item) => item.guitarId
    );
    const discoveredEffects = buildDiscoveredSet(
      data.arsenal.dexEffects,
      effectInventory,
      (item) => item.effectId
    );

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
      effectInventory,
      dexGuitars: [...discoveredGuitars],
      dexEffects: [...discoveredEffects],
      // Accounts created before the scrap system have no wallet yet.
      parts: data.arsenal.parts || [],
      // Trader purchases. Sent as stored; a counter from an earlier window is
      // simply ignored by the shop front, which knows today's window.
      ...(data.arsenal.trader ? { trader: data.arsenal.trader } : {}),
      // How the player arranged their stash. Cosmetic, and validated by the
      // board itself, so it travels exactly as stored.
      ...(data.arsenal.stashLayout
        ? { stashLayout: data.arsenal.stashLayout }
        : {}),
      // Mods rescued from teardowns. Absent on every account that has not
      // scrapped a modded instrument yet.
      ...(Array.isArray(data.arsenal.salvagedMods)
        ? { salvagedMods: data.arsenal.salvagedMods }
        : {}),
    };

    // Reconcile the denormalized rig level (backfills old accounts, self-heals
    // after gear-balance changes in itemStats/effectStats) and persist any
    // discovery the record was still missing, so it survives the next sale.
    const computedRigLevel = getRigLevel(arsenal);
    const updates: Record<string, unknown> = {};
    if (data.rigLevel !== computedRigLevel) updates.rigLevel = computedRigLevel;
    if (new Set(data.arsenal.dexGuitars || []).size !== discoveredGuitars.size) {
      updates["arsenal.dexGuitars"] = [...discoveredGuitars];
    }
    if (new Set(data.arsenal.dexEffects || []).size !== discoveredEffects.size) {
      updates["arsenal.dexEffects"] = [...discoveredEffects];
    }
    if (Object.keys(updates).length > 0) {
      await userRef.update(updates);
    }

    return res.status(200).json({ ...arsenal, fame });
  } catch (error) {
    console.error("[inventory]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
