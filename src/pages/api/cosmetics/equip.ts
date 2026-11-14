import { COSMETIC_KINDS } from "feature/cosmetics/data/cosmeticsCatalog";
import type {
  CosmeticKind,
  CosmeticsState,
} from "feature/cosmetics/types/cosmetics.types";
import { readWardrobe, withEquipped } from "feature/cosmetics/utils/wardrobe";
import type { Transaction } from "firebase-admin/firestore";
import {
  saveWardrobe,
  uidFromRequest,
  wardrobeRef,
} from "lib/cosmetics/cosmeticsStore";
import type { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * Puts an owned piece on, or clears a slot when `itemId` is null. Free, and
 * open to any signed-in player: what was bought stays theirs to wear.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const uid = await uidFromRequest(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });

  const { slot, itemId } = req.body as { slot?: unknown; itemId?: unknown };
  if (!COSMETIC_KINDS.includes(slot as CosmeticKind)) {
    return res.status(400).json({ error: "Invalid slot" });
  }
  if (itemId !== null && typeof itemId !== "string") {
    return res.status(400).json({ error: "Invalid itemId" });
  }

  try {
    const result = await firestore.runTransaction(
      async (tx: Transaction): Promise<CosmeticsState> => {
        const wardrobe = readWardrobe((await tx.get(wardrobeRef(uid))).data());
        const next = withEquipped(wardrobe, slot as CosmeticKind, itemId);
        if (!next) throw new Error("NOT_OWNED");
        saveWardrobe(tx, uid, next);
        return next;
      },
    );

    return res.status(200).json(result);
  } catch (error: any) {
    if (error?.message === "NOT_OWNED") {
      return res.status(403).json({ error: "You do not own this" });
    }
    console.error("[cosmetics/equip]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
