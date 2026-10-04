import {
  COMMISSION_LOG_LABEL,
  COMMISSION_MIN_LEVEL,
  getCommissionBlock,
  getCommissionedEffect,
  getCommissionedGuitar,
  getCommissionQuote,
  getEffectCommissionSubject,
  getGuitarCommissionSubject,
} from "feature/arsenal/data/commission";
import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { recipeToParts, subtractParts } from "feature/arsenal/data/workshop";
import type {
  EffectInventoryItem,
  InventoryItem,
  ScrapPart,
  WorkshopCommissionResult,
} from "feature/arsenal/types/arsenal.types";
import { appendBuildLog } from "feature/arsenal/utils/buildLog";
import { buildDiscoveredSet } from "feature/arsenal/utils/dex";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/** Map lookups are strict, and a model id may arrive as either type. */
const findDefinition = <T>(
  byId: Map<number | string, T>,
  id: number | string,
): T | undefined =>
  byId.get(id) ?? byId.get(Number(id)) ?? byId.get(String(id));

/**
 * Builds a model the account has never held, from scratch.
 *
 * The client names the model and nothing else. Whether it may be ordered — the
 * account's level, the Dex record, the roadmap-trophy rule — and what it costs
 * are all recomputed here from the stored document, inside the transaction, by
 * the same pure functions the dialog quoted from. See `data/commission.ts` for
 * the rules and the reasons behind every number.
 *
 * Delivery is a mint like any other: a fresh serial off the model's counter, a
 * new stash entry, and the model written into the Dex — which is also what makes
 * the order a one-off, because the Dex is what the next order is checked against.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, kind, definitionId } = req.body as {
    idToken: string;
    kind: "guitar" | "effect";
    definitionId: number | string;
  };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (kind !== "guitar" && kind !== "effect") {
    return res.status(400).json({ error: "Invalid kind" });
  }
  if (definitionId === undefined || definitionId === null) {
    return res.status(400).json({ error: "Missing definitionId" });
  }

  const guitar =
    kind === "guitar" ? findDefinition(GUITARS_BY_ID, definitionId) : undefined;
  const effect =
    kind === "effect" ? findDefinition(EFFECTS_BY_ID, definitionId) : undefined;
  const subject = guitar
    ? getGuitarCommissionSubject(guitar)
    : effect
      ? getEffectCommissionSubject(effect)
      : null;
  if (!subject) {
    return res.status(404).json({ error: "Item definition not found" });
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

    const result = await firestore.runTransaction(
      async (t: Transaction): Promise<WorkshopCommissionResult> => {
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) throw new Error("USER_NOT_FOUND");

        const data = userDoc.data()!;
        const playerLvl: number = data.statistics?.lvl ?? 1;
        const fame: number = data.statistics?.fame ?? 0;
        const wallet: ScrapPart[] = data.arsenal?.parts ?? [];
        const inventory: InventoryItem[] = data.arsenal?.inventory ?? [];
        const effectInventory: EffectInventoryItem[] =
          data.arsenal?.effectInventory ?? [];

        // Against the Dex record, not the stash: a model sold months ago is
        // still discovered, and that is exactly what stops a second order.
        const discovered = guitar
          ? buildDiscoveredSet(
              data.arsenal?.dexGuitars,
              inventory,
              (i) => i.guitarId,
            ).has(guitar.id)
          : buildDiscoveredSet(
              data.arsenal?.dexEffects,
              effectInventory,
              (i) => i.effectId,
            ).has(effect!.id);

        const block = getCommissionBlock({ subject, discovered, playerLvl });
        if (block) throw new Error(`BLOCKED_${block.toUpperCase()}`);

        const quote = getCommissionQuote(subject, wallet, fame);
        if (fame < quote.fame) throw new Error("INSUFFICIENT_FAME");
        if (!quote.recipe.every((line) => line.ok)) {
          throw new Error("INSUFFICIENT_PARTS");
        }
        const spent = recipeToParts(quote.recipe);

        const serialRef = firestore
          .collection("arsenalSerials")
          .doc(`${subject.kind}-${subject.definitionId}`) as DocumentReference;
        const serialDoc = await t.get(serialRef);
        const serial = (serialDoc.data()?.count || 0) + 1;

        const minted = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          acquiredAt: Date.now(),
          isNew: true,
          serial,
          buildLog: appendBuildLog(undefined, COMMISSION_LOG_LABEL),
        };

        const newParts = subtractParts(wallet, spent);
        const newFame = fame - quote.fame;

        let item: InventoryItem | EffectInventoryItem;
        if (guitar) {
          const newItem: InventoryItem = {
            ...getCommissionedGuitar(guitar),
            ...minted,
          };
          item = newItem;
          t.update(userRef, {
            "statistics.fame": newFame,
            "arsenal.parts": newParts,
            "arsenal.inventory": [...inventory, newItem],
            "arsenal.dexGuitars": FieldValue.arrayUnion(guitar.id),
          });
        } else {
          const newItem: EffectInventoryItem = {
            ...getCommissionedEffect(effect!),
            ...minted,
          };
          item = newItem;
          t.update(userRef, {
            "statistics.fame": newFame,
            "arsenal.parts": newParts,
            "arsenal.effectInventory": [...effectInventory, newItem],
            "arsenal.dexEffects": FieldValue.arrayUnion(effect!.id),
          });
        }
        t.set(serialRef, { count: serial }, { merge: true });

        return {
          kind: subject.kind,
          item,
          fameSpent: quote.fame,
          spent,
          newParts,
          newFame,
        };
      },
    );

    return res.status(200).json(result);
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    switch (code) {
      case "USER_NOT_FOUND":
        return res.status(404).json({ error: "User not found" });
      case "BLOCKED_TROPHY":
        return res
          .status(400)
          .json({ error: "Roadmap trophies can only be won on the roadmap" });
      case "BLOCKED_RARITY":
        return res
          .status(400)
          .json({ error: "The bench cannot build this model" });
      case "BLOCKED_DISCOVERED":
        return res
          .status(409)
          .json({ error: "This model is already in your Dex" });
      case "BLOCKED_LEVEL":
        return res.status(403).json({
          error: `Commissions open at level ${COMMISSION_MIN_LEVEL}`,
        });
      case "INSUFFICIENT_FAME":
        return res.status(400).json({ error: "Not enough Fame Points" });
      case "INSUFFICIENT_PARTS":
        return res
          .status(400)
          .json({ error: "Not enough parts for this commission" });
      default:
        console.error("[workshop/commission]", error);
        return res.status(500).json({ error: "Internal server error" });
    }
  }
}
