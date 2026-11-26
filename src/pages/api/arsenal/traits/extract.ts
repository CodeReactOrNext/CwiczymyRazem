import {
  decideExtract,
  type ExtractTraitResult,
  getTraitLabel,
  getTraitTarget,
} from "feature/arsenal/data/traitCraft";
import type {
  EffectInventoryItem,
  InventoryItem,
  TraitExtractor,
  TraitImprint,
} from "feature/arsenal/types/arsenal.types";
import { appendBuildLog } from "feature/arsenal/utils/buildLog";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Lifts one trait off an instrument with a Trait Extractor. The extractor is
 * used up, the trait leaves the instrument, and an imprint carrying its exact
 * value lands in the stash. See `data/traitCraft.ts`.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { idToken, itemId, kind, traitId } = req.body as {
    idToken?: string;
    itemId?: string;
    kind?: "guitar" | "effect";
    traitId?: string;
  };
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!itemId || !traitId)
    return res.status(400).json({ error: "Missing itemId or traitId" });
  if (kind !== "guitar" && kind !== "effect")
    return res.status(400).json({ error: "Invalid kind" });

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

    const result = await firestore.runTransaction(
      async (t: Transaction): Promise<ExtractTraitResult> => {
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) throw new Error("USER_NOT_FOUND");

        const data = userDoc.data()!;
        const listKey = kind === "guitar" ? "inventory" : "effectInventory";
        const list: (InventoryItem | EffectInventoryItem)[] =
          data.arsenal?.[listKey] ?? [];
        const index = list.findIndex((item) => item.id === itemId);
        if (index === -1) throw new Error("ITEM_NOT_FOUND");

        const item = list[index];
        const target = getTraitTarget(kind, item);
        if (!target) throw new Error("DEFINITION_NOT_FOUND");

        const extractors: TraitExtractor[] =
          data.arsenal?.traitExtractors ?? [];
        const imprints: TraitImprint[] = data.arsenal?.traitImprints ?? [];
        const decision = decideExtract({
          salt: Math.random().toString(36).slice(2, 10),
          kind,
          traits: item.traits,
          traitId,
          extractors,
          nowMs: Date.now(),
        });
        if (!decision.ok) throw new Error(decision.reason);

        const updated = {
          ...item,
          buildLog: appendBuildLog(
            item.buildLog,
            `${getTraitLabel(traitId, decision.imprint.params)} extracted`,
          ),
        } as InventoryItem | EffectInventoryItem;
        if (decision.traits.length > 0) updated.traits = decision.traits;
        else delete updated.traits;

        const newList = list.map((entry, i) => (i === index ? updated : entry));

        t.update(userRef, {
          [`arsenal.${listKey}`]: newList,
          "arsenal.traitExtractors": decision.extractors,
          "arsenal.traitImprints": [...imprints, decision.imprint],
        });

        return {
          imprint: decision.imprint,
          item: updated,
          extractorsLeft: decision.extractors.length,
        };
      },
    );

    return res.status(200).json(result);
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    switch (code) {
      case "USER_NOT_FOUND":
      case "ITEM_NOT_FOUND":
      case "DEFINITION_NOT_FOUND":
        return res.status(404).json({ error: code });
      case "NO_EXTRACTOR":
        return res
          .status(400)
          .json({ error: "You need a Trait Extractor for this" });
      case "NO_TRAIT":
        return res
          .status(400)
          .json({ error: "That trait is not on this item" });
      default:
        console.error("[arsenal/traits/extract]", error);
        return res.status(500).json({ error: "Internal server error" });
    }
  }
}
