import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { getRigLevel } from "feature/arsenal/data/rigLevel";
import {
  getEffectSubject,
  getGuitarSubject,
  getRepairQuote,
  subtractParts,
} from "feature/arsenal/data/workshop";
import type {
  EffectInventoryItem,
  InventoryItem,
  ScrapPart,
} from "feature/arsenal/types/arsenal.types";
import { DEFAULT_RIG } from "feature/arsenal/types/arsenal.types";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Restores an item by one condition grade.
 *
 * The first repair pins `mintCondition` to whatever the item rolled at, and
 * `getItemValue` prices from that number forever after — so a restoration raises
 * Item Level (which is what the leaderboard ranks) but never what the game pays
 * for the item. Without that pin, buying a Relic cheap, restoring it and selling
 * it back would be a Fame printer.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, itemId, kind } = req.body as {
    idToken: string;
    itemId: string;
    kind: "guitar" | "effect";
  };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!itemId) return res.status(400).json({ error: "Missing itemId" });
  if (kind !== "guitar" && kind !== "effect") {
    return res.status(400).json({ error: "Invalid kind" });
  }

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userRef = firestore
      .collection("users")
      .doc(userId) as DocumentReference;

    const result = await firestore.runTransaction(async (t: Transaction) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error("USER_NOT_FOUND");

      const data = userDoc.data()!;
      const inventory: InventoryItem[] = data.arsenal?.inventory ?? [];
      const effectInventory: EffectInventoryItem[] =
        data.arsenal?.effectInventory ?? [];
      const wallet: ScrapPart[] = data.arsenal?.parts ?? [];

      const list = kind === "guitar" ? inventory : effectInventory;
      const index = list.findIndex((item) => item.id === itemId);
      if (index === -1) throw new Error("ITEM_NOT_FOUND");

      const item = list[index];
      const subject =
        kind === "guitar"
          ? (() => {
              const def = GUITARS_BY_ID.get((item as InventoryItem).guitarId);
              if (!def) throw new Error("DEFINITION_NOT_FOUND");
              return getGuitarSubject(item as InventoryItem, def);
            })()
          : (() => {
              const def = EFFECTS_BY_ID.get(
                (item as EffectInventoryItem).effectId,
              );
              if (!def) throw new Error("DEFINITION_NOT_FOUND");
              return getEffectSubject(item as EffectInventoryItem, def);
            })();

      const quote = getRepairQuote(subject, wallet);
      if (!quote.target) throw new Error("ALREADY_MUSEUM");
      if (!quote.canRepair || !quote.payment)
        throw new Error("REQUIREMENT_PARTS");

      const restored = {
        ...item,
        condition: quote.toCondition,
        // Captured once, from the condition the item rolled at — never overwritten.
        mintCondition: item.mintCondition ?? quote.fromCondition,
        restored: true,
      };

      const newList = [...list];
      newList[index] = restored;
      const newInventory =
        kind === "guitar" ? (newList as InventoryItem[]) : inventory;
      const newEffects =
        kind === "effect"
          ? (newList as EffectInventoryItem[])
          : effectInventory;

      const newParts = subtractParts(wallet, quote.payment.parts);

      const rigLevel = getRigLevel({
        inventory: newInventory,
        effectInventory: newEffects,
        rig: data.arsenal?.rig ?? DEFAULT_RIG,
      });

      t.update(userRef, {
        [kind === "guitar" ? "arsenal.inventory" : "arsenal.effectInventory"]:
          newList,
        "arsenal.parts": newParts,
        rigLevel,
      });

      return {
        grade: quote.target,
        condition: quote.toCondition,
        levelGain: quote.gain,
        spent: quote.payment.parts,
        newParts,
        rigLevel,
      };
    });

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "USER_NOT_FOUND")
      return res.status(404).json({ error: "User not found" });
    if (code === "ITEM_NOT_FOUND")
      return res.status(404).json({ error: "Item not found" });
    if (code === "DEFINITION_NOT_FOUND") {
      return res.status(404).json({ error: "Item definition not found" });
    }
    if (code === "ALREADY_MUSEUM") {
      return res
        .status(400)
        .json({ error: "This item is already in Museum condition" });
    }
    if (code === "REQUIREMENT_PARTS") {
      return res
        .status(400)
        .json({ error: "Not enough parts for this repair" });
    }
    console.error("[workshop/repair]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
