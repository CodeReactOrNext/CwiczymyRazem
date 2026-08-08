import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { getRigLevel } from "feature/arsenal/data/rigLevel";
import {
  getBuildQuote,
  getEffectSubject,
  getGuitarSubject,
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
 * Buys one build level for an item.
 *
 * The whole bill — parts, Fame, the condition gate — is recomputed here from the
 * stored item and the stored wallet. The client only says *which* item, never what
 * it should cost, and because `getBuildQuote` is deterministic the number it showed
 * is the number charged.
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
      const fame: number = data.statistics?.fame ?? 0;

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

      const quote = getBuildQuote(subject, wallet, fame);
      if (!quote.canBuild || !quote.payment) {
        const failed = quote.checks.find((c) => !c.ok);
        throw new Error(
          failed
            ? `REQUIREMENT_${failed.kind.toUpperCase()}`
            : "REQUIREMENT_PARTS",
        );
      }

      const buildLevel = subject.buildLevel + 1;
      const upgraded = {
        ...item,
        buildLevel,
        buildLog: [...(item.buildLog ?? []), quote.modName],
      };

      const newList = [...list];
      newList[index] = upgraded;
      const newInventory =
        kind === "guitar" ? (newList as InventoryItem[]) : inventory;
      const newEffects =
        kind === "effect"
          ? (newList as EffectInventoryItem[])
          : effectInventory;

      const newParts = subtractParts(wallet, quote.payment.parts);
      const newFame = fame - quote.requirement.fame;

      const rigLevel = getRigLevel({
        inventory: newInventory,
        effectInventory: newEffects,
        rig: data.arsenal?.rig ?? DEFAULT_RIG,
      });

      t.update(userRef, {
        [kind === "guitar" ? "arsenal.inventory" : "arsenal.effectInventory"]:
          newList,
        "arsenal.parts": newParts,
        "statistics.fame": newFame,
        rigLevel,
      });

      return {
        buildLevel,
        modName: quote.modName,
        levelGain: quote.gain,
        spent: quote.payment.parts,
        newParts,
        newFame,
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
    if (code.startsWith("REQUIREMENT_")) {
      const what = code.replace("REQUIREMENT_", "").toLowerCase();
      const messages: Record<string, string> = {
        condition: "Restore the item's condition before building further",
        parts: "Not enough parts for this build level",
        distinct: "You are missing part types this build needs",
        unique: "This build level needs Unique parts",
        fame: "Not enough Fame for this build level",
      };
      return res
        .status(400)
        .json({ error: messages[what] ?? "Build requirements not met" });
    }
    console.error("[workshop/build]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
