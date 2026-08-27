import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { sumEffectStats } from "feature/arsenal/data/effectStats";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { sumFeatureStats } from "feature/arsenal/data/itemStats";
import { getRigLevel } from "feature/arsenal/data/rigLevel";
import { getSalvagedModOptions } from "feature/arsenal/data/salvage";
import {
  getEffectSubject,
  getGuitarSubject,
  getModDef,
  getModQuote,
  MOD_REMOVE_FAME_COST,
  recipeToParts,
  rollModPoints,
  subtractParts,
} from "feature/arsenal/data/workshop";
import type {
  EffectInventoryItem,
  InventoryItem,
  ItemFeature,
  SalvagedMod,
  ScrapPart,
  WorkshopModAction,
} from "feature/arsenal/types/arsenal.types";
import { DEFAULT_RIG } from "feature/arsenal/types/arsenal.types";
import { appendBuildLog } from "feature/arsenal/utils/buildLog";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Bolts on a mod the player owns, re-rolls one already fitted, or strips one off.
 *
 * Nothing here *sells* a mod. A mod is a component: it comes off a teardown or
 * over the trader's counter, waits in `salvagedMods`, and this route fits it at
 * the value it already carries. Nothing is rolled and nothing is charged for
 * that — the player paid an entire instrument, or a day's Fame, for it already;
 * see `data/salvage.ts`.
 *
 * A re-roll is the one job left that spends parts, and it is where the bench's
 * edge over a case roll lives. The value is rolled here and never on the client,
 * and `getModQuote` is deterministic, so the bill shown is the bill charged and
 * the only thing the request can influence is which fitted mod it names.
 *
 * A removal is the mirror image: nothing is rolled, nothing is spent out of the
 * wallet, a flat `MOD_REMOVE_FAME_COST` is charged, and the mod is *gone* — it is
 * never written to `salvagedMods`, because a fee this small must not undercut the
 * teardown that is the real way to move a mod between instruments.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, itemId, kind, featureId, action, salvagedId } = req.body as {
    idToken: string;
    itemId: string;
    kind: "guitar" | "effect";
    /** The named mod to fit, re-roll or remove. Unused by a salvaged fit. */
    featureId?: string;
    action: WorkshopModAction;
    /** The stash entry a salvaged fit consumes. */
    salvagedId?: string;
  };

  const isSalvaged = action === "fit-salvaged";
  const isRemove = action === "remove";

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!itemId) return res.status(400).json({ error: "Missing itemId" });
  if (isSalvaged) {
    if (!salvagedId)
      return res.status(400).json({ error: "Missing salvagedId" });
  } else if (!featureId) {
    return res.status(400).json({ error: "Missing featureId" });
  }
  // A tab left open from before mods became components still asks to buy one.
  if ((action as string) === "fit") {
    return res
      .status(400)
      .json({ error: "Mods are fitted from your stash now — reload the page" });
  }
  if (action !== "reroll" && !isRemove && !isSalvaged) {
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

      const quote = getModQuote(subject, wallet, fame);
      const salvagedMods: SalvagedMod[] = data.arsenal?.salvagedMods ?? [];

      const features: ItemFeature[] = subject.features.map((f) => ({ ...f }));
      let pointsBefore: number | undefined;
      let target: ItemFeature;
      let label: string;
      let spent: ScrapPart[];
      let fameSpent = 0;
      let logLine: string;
      let newSalvagedMods = salvagedMods;

      if (isRemove) {
        // Resolved off the item's own features rather than off `quote.fitted`:
        // a mod the pool no longer knows has no definition and so never reaches
        // that list, and being unable to take it off would strand the slot.
        const at = features.findIndex((f) => f.id === featureId);
        if (at === -1) throw new Error("REQUIREMENT_NOT_FITTED");
        if (fame < MOD_REMOVE_FAME_COST) throw new Error("REQUIREMENT_FAME");

        const [removed] = features.splice(at, 1);
        // Not pushed anywhere: the mod is destroyed, not stashed. `salvagedMods`
        // is only ever written by a teardown.
        target = { id: removed.id, points: 0 };
        pointsBefore = removed.points;
        label = getModDef(subject.kind, removed.id)?.label ?? removed.id;
        spent = [];
        fameSpent = MOD_REMOVE_FAME_COST;
        logLine = `${label} +${removed.points} stripped out`;
      } else if (isSalvaged) {
        // Resolved from the stash the same way the bench resolved it, so a
        // request cannot name a mod the player does not own or one that does
        // not fit this instrument.
        const offer = getSalvagedModOptions(subject, salvagedMods).find(
          (o) => o.salvagedId === salvagedId,
        );
        if (!offer) throw new Error("REQUIREMENT_UNAVAILABLE");
        if (quote.slots.free <= 0) throw new Error("REQUIREMENT_SLOTS");

        // Nothing is rolled and nothing is charged: the mod arrives with the
        // value it was salvaged at, already paid for with the instrument it was
        // torn off.
        target = { id: offer.featureId, points: offer.points };
        features.push(target);
        label = offer.label;
        spent = [];
        logLine = `${offer.label} refitted from ${offer.sourceName}`;
        newSalvagedMods = salvagedMods.filter((m) => m.id !== offer.salvagedId);
      } else {
        // The priced option is the single source of both the bill and the range —
        // exactly the object the client was looking at when it sent this.
        const option = quote.fitted.find((f) => f.id === featureId);
        if (!option) throw new Error("REQUIREMENT_NOT_FITTED");
        if (!option.affordable) throw new Error("REQUIREMENT_PARTS");

        // `option` came out of `quote.fitted`, so the feature is certainly there.
        target = features.find((f) => f.id === featureId)!;
        pointsBefore = target.points;

        // A re-roll always replaces, including downward — that is the whole risk.
        target.points = rollModPoints(option);
        label = option.label;
        spent = recipeToParts(option.recipe);
        logLine = `${option.label} re-spec`;
      }

      const buildLog = appendBuildLog(item.buildLog, logLine);

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
      const newFame = fame - fameSpent;

      const rigLevel = getRigLevel({
        inventory: newInventory,
        effectInventory: newEffects,
        rig: data.arsenal?.rig ?? DEFAULT_RIG,
      });

      t.update(userRef, {
        [kind === "guitar" ? "arsenal.inventory" : "arsenal.effectInventory"]:
          newList,
        "arsenal.parts": newParts,
        ...(isSalvaged ? { "arsenal.salvagedMods": newSalvagedMods } : {}),
        ...(fameSpent > 0 ? { "statistics.fame": newFame } : {}),
        rigLevel,
      });

      return {
        action,
        featureId: target.id,
        label,
        points: target.points,
        pointsBefore,
        // Feature points feed the item level one for one, so the delta is the
        // gain — negative on a removal, which hands the whole value back.
        levelGain: target.points - (pointsBefore ?? 0),
        spent,
        // Mirrored into the client's Fame counter, which lives outside this query.
        fameSpent,
        item: upgraded,
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
        parts: "Not enough parts for this mod",
        slots: "Every mod slot at this rarity is filled — promote it first",
        not_fitted: "That mod is not on this item",
        unavailable: "That mod does not fit this instrument",
        fame: `Taking a mod off costs ${MOD_REMOVE_FAME_COST} Fame`,
      };
      return res
        .status(400)
        .json({ error: messages[what] ?? "Mod requirements not met" });
    }
    console.error("[workshop/mod]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
