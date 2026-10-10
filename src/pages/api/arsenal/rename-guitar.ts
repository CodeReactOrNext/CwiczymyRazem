import type { InventoryItem } from "feature/arsenal/types/arsenal.types";
import {
  cleanGuitarName,
  customGuitarId,
  parseCustomGuitarId,
} from "feature/guitarBuilder/utils/customGuitar";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Renames a guitar built in the Guitar Builder. Free, and the picture stays:
 * the name lives in the guitar's id, so only the id changes — and with it the
 * equipped id, when this is the equipped guitar.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    idToken,
    itemId,
    name: rawName,
  } = req.body as {
    idToken: string;
    itemId: string;
    name: unknown;
  };
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!itemId) return res.status(400).json({ error: "Missing itemId" });
  const name = cleanGuitarName(rawName);

  let userId: string;
  try {
    userId = (await auth.verifyIdToken(idToken)).uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userRef = firestore
      .collection("users")
      .doc(userId) as DocumentReference;
    const item = await firestore.runTransaction(async (t: Transaction) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error("USER_NOT_FOUND");
      const arsenal = doc.data()!.arsenal ?? {};
      const inventory: InventoryItem[] = [...(arsenal.inventory ?? [])];
      const index = inventory.findIndex((i) => i.id === itemId);
      const ref =
        index >= 0 ? parseCustomGuitarId(inventory[index].guitarId) : null;
      if (!ref || !inventory[index].custom) throw new Error("NOT_A_BUILD");

      const guitarId = customGuitarId({ ...ref, name });
      const renamed = { ...inventory[index], guitarId };
      inventory[index] = renamed;
      t.update(userRef, {
        "arsenal.inventory": inventory,
        ...(arsenal.equippedItemId === itemId
          ? { "arsenal.equippedGuitarId": guitarId }
          : {}),
      });
      return renamed;
    });
    return res.status(200).json({ item });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "USER_NOT_FOUND")
      return res.status(404).json({ error: "User not found" });
    if (code === "NOT_A_BUILD")
      return res
        .status(400)
        .json({ error: "Only built guitars can be renamed" });
    console.error("[rename-guitar]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
