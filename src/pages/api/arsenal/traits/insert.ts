import {
  decideInsert,
  getTraitLabel,
  getTraitTarget,
  type InsertTraitResult,
} from "feature/arsenal/data/traitCraft";
import type {
  EffectInventoryItem,
  InventoryItem,
  TraitImprint,
} from "feature/arsenal/types/arsenal.types";
import { appendBuildLog } from "feature/arsenal/utils/buildLog";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Puts a Trait Imprint into an instrument. Everything that decides it is read
 * here, inside one transaction — the imprint, the instrument, its traits and
 * the Fame — and the price grows with every trait the instrument already
 * carries, up to three. See `data/traitCraft.ts`.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { idToken, imprintId, itemId, kind } = req.body as {
    idToken?: string;
    imprintId?: string;
    itemId?: string;
    kind?: "guitar" | "effect";
  };
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!imprintId || !itemId)
    return res.status(400).json({ error: "Missing imprintId or itemId" });
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
      async (t: Transaction): Promise<InsertTraitResult> => {
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) throw new Error("USER_NOT_FOUND");

        const data = userDoc.data()!;
        const imprints: TraitImprint[] = data.arsenal?.traitImprints ?? [];
        const imprint = imprints.find((entry) => entry.id === imprintId);
        if (!imprint) throw new Error("IMPRINT_NOT_FOUND");

        const listKey = kind === "guitar" ? "inventory" : "effectInventory";
        const list: (InventoryItem | EffectInventoryItem)[] =
          data.arsenal?.[listKey] ?? [];
        const index = list.findIndex((item) => item.id === itemId);
        if (index === -1) throw new Error("ITEM_NOT_FOUND");

        const item = list[index];
        const target = getTraitTarget(kind, item);
        if (!target) throw new Error("DEFINITION_NOT_FOUND");

        const decision = decideInsert({
          imprint,
          kind,
          rarity: target.rarity,
          effectType: target.effectType,
          traits: item.traits,
        });
        if (!decision.ok) throw new Error(decision.reason);

        const fame: number = data.statistics?.fame ?? 0;
        if (fame < decision.cost) throw new Error("NOT_ENOUGH_FAME");

        const updated = {
          ...item,
          traits: decision.traits,
          buildLog: appendBuildLog(
            item.buildLog,
            `${getTraitLabel(imprint.traitId, imprint.params)} put in`,
          ),
        } as InventoryItem | EffectInventoryItem;
        const newFame = fame - decision.cost;

        t.update(userRef, {
          [`arsenal.${listKey}`]: list.map((entry, i) =>
            i === index ? updated : entry,
          ),
          "arsenal.traitImprints": imprints.filter(
            (entry) => entry.id !== imprintId,
          ),
          "statistics.fame": newFame,
        });

        return { item: updated, fameSpent: decision.cost, newFame };
      },
    );

    return res.status(200).json(result);
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const messages: Record<string, [number, string]> = {
      USER_NOT_FOUND: [404, "User not found"],
      IMPRINT_NOT_FOUND: [404, "That imprint is not in your stash"],
      ITEM_NOT_FOUND: [404, "Item not found"],
      DEFINITION_NOT_FOUND: [404, "Item definition not found"],
      UNKNOWN_TRAIT: [400, "This trait no longer exists"],
      WRONG_KIND: [
        400,
        "Guitar traits go into guitars, pedal traits into pedals",
      ],
      NOT_ELIGIBLE: [400, "This trait does not fit this instrument"],
      DUPLICATE: [400, "This instrument already has that trait"],
      FULL: [400, "This instrument already has three traits"],
      NOT_ENOUGH_FAME: [400, "Not enough Fame"],
    };
    const known = messages[code];
    if (known) return res.status(known[0]).json({ error: known[1], code });
    console.error("[arsenal/traits/insert]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
