import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { sumEffectStats } from "feature/arsenal/data/effectStats";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { sumFeatureStats } from "feature/arsenal/data/itemStats";
import { getRigLevel } from "feature/arsenal/data/rigLevel";
import {
  getEffectSubject,
  getGuitarSubject,
  getModQuote,
  recipeToParts,
  rollModPoints,
  subtractParts,
} from "feature/arsenal/data/workshop";
import type {
  EffectInventoryItem,
  InventoryItem,
  ItemFeature,
  ScrapPart,
} from "feature/arsenal/types/arsenal.types";
import { DEFAULT_RIG } from "feature/arsenal/types/arsenal.types";
import { appendBuildLog } from "feature/arsenal/utils/buildLog";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Fits a mod, or re-rolls one already fitted.
 *
 * The player picks *which* mod — each one has its own bill, so there is nothing
 * random about the price — but the value is rolled here and never on the client.
 * `getModQuote` is deterministic, so the bill shown is the bill charged, and the
 * only thing the request can influence is which named mod it asks for.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, itemId, kind, featureId, action } = req.body as {
    idToken: string;
    itemId: string;
    kind: "guitar" | "effect";
    /** The named mod to fit or re-roll. */
    featureId: string;
    action: "fit" | "reroll";
  };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!itemId) return res.status(400).json({ error: "Missing itemId" });
  if (!featureId) return res.status(400).json({ error: "Missing featureId" });
  if (action !== "fit" && action !== "reroll") {
    return res.status(400).json({ error: "Invalid action" });
  }
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

      const quote = getModQuote(subject, wallet);
      const isReroll = action === "reroll";

      // The priced option is the single source of both the bill and the range —
      // exactly the object the client was looking at when it sent this.
      const option = isReroll
        ? quote.fitted.find((f) => f.id === featureId)
        : quote.candidates.find((c) => c.id === featureId);

      if (!option) {
        throw new Error(
          isReroll ? "REQUIREMENT_NOT_FITTED" : "REQUIREMENT_UNAVAILABLE",
        );
      }
      if (!option.affordable) throw new Error("REQUIREMENT_PARTS");

      const features: ItemFeature[] = subject.features.map((f) => ({ ...f }));
      let pointsBefore: number | undefined;
      let target: ItemFeature;

      if (isReroll) {
        // `option` came out of `quote.fitted`, so the feature is certainly there.
        target = features.find((f) => f.id === featureId)!;
        pointsBefore = target.points;
      } else {
        if (quote.slots.free <= 0) throw new Error("REQUIREMENT_SLOTS");
        target = { id: option.id, points: 0 };
        features.push(target);
      }

      // A re-roll always replaces, including downward — that is the whole risk.
      target.points = rollModPoints(option);

      const spent = recipeToParts(option.recipe);
      const buildLog = appendBuildLog(
        item.buildLog,
        isReroll ? `${option.label} re-spec` : `${option.label} fitted`,
      );

      // Built per kind rather than spread once: the two inventories keep their own
      // stat shapes (`ItemStats` vs `EffectStats`) and must not blur into a union.
      const upgraded =
        kind === "guitar"
          ? {
              ...(item as InventoryItem),
              features,
              stats: sumFeatureStats(features),
              buildLog,
            }
          : {
              ...(item as EffectInventoryItem),
              features,
              stats: sumEffectStats(features),
              buildLog,
            };

      const newList = [...list];
      newList[index] = upgraded;
      const newInventory =
        kind === "guitar" ? (newList as InventoryItem[]) : inventory;
      const newEffects =
        kind === "effect"
          ? (newList as EffectInventoryItem[])
          : effectInventory;

      const newParts = subtractParts(wallet, spent);

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
        action,
        featureId: option.id,
        label: option.label,
        points: target.points,
        pointsBefore,
        // Feature points feed the item level one for one, so the delta is the gain.
        levelGain: target.points - (pointsBefore ?? 0),
        spent,
        item: upgraded,
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
    if (code.startsWith("REQUIREMENT_")) {
      const what = code.replace("REQUIREMENT_", "").toLowerCase();
      const messages: Record<string, string> = {
        parts: "Not enough parts for this mod",
        slots: "Every mod slot at this rarity is filled — promote it first",
        not_fitted: "That mod is not on this item",
        unavailable: "That mod does not fit this instrument",
      };
      return res
        .status(400)
        .json({ error: messages[what] ?? "Mod requirements not met" });
    }
    console.error("[workshop/mod]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
