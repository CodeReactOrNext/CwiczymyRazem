import { randomUUID } from "node:crypto";

import { getRigLevel } from "feature/arsenal/data/rigLevel";
import type {
  ArsenalUserData,
  InventoryItem,
} from "feature/arsenal/types/arsenal.types";
import { DEFAULT_RIG } from "feature/arsenal/types/arsenal.types";
import {
  MAX_STICKERS,
  STOCK_PARTS,
} from "feature/guitarBuilder/data/guitarParts";
import { renderGuitarImage } from "feature/guitarBuilder/server/renderGuitarImage";
import type {
  Loadout,
  OwnedComponent,
  PlacedSticker,
} from "feature/guitarBuilder/types/guitarBuilder.types";
import {
  checkBuild,
  toGuitarBuild,
} from "feature/guitarBuilder/utils/components";
import {
  buildFameCost,
  cleanGuitarName,
  CUSTOM_GUITAR_FOLDER,
  customGuitarDefinition,
  customGuitarId,
  parseCustomGuitarId,
  rebuildFameCost,
} from "feature/guitarBuilder/utils/customGuitar";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/** Marks a refusal the player should read, as opposed to an internal failure. */
const REFUSED = "REFUSED:";

/** Built guitars come out of the bench in near-mint shape. */
const BUILT_CONDITION = 0.95;

const SLOTS: (keyof Loadout)[] = [
  "body",
  "neck",
  "head",
  "pickups",
  "finish",
  "pickguard",
];

function originOf(req: NextApiRequest) {
  const proto = (req.headers["x-forwarded-proto"] as string) || "http";
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host;
  return `${proto}://${host}`;
}

/** Only the fields a loadout and a sticker have — never trust the body as-is. */
function readRequest(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>;
  const raw = (b.loadout ?? {}) as Record<string, unknown>;
  const loadout = Object.fromEntries(
    SLOTS.map((slot) => [
      slot,
      typeof raw[slot] === "string" ? raw[slot] : null,
    ]),
  ) as unknown as Loadout;
  const num = (v: unknown, min: number, max: number) =>
    typeof v === "number" && Number.isFinite(v)
      ? Math.min(max, Math.max(min, v))
      : 0;
  const stickers: PlacedSticker[] = (
    Array.isArray(b.stickers) ? b.stickers : []
  )
    .slice(0, MAX_STICKERS + 1)
    .map((s: Record<string, unknown>) => ({
      id: String(s?.id ?? ""),
      key: String(s?.key ?? ""),
      x: num(s?.x, -400, 2000),
      y: num(s?.y, -400, 2000),
      size: num(s?.size, 16, 400),
      rotation: num(s?.rotation, -180, 180),
    }));
  return {
    // undefined = keep what the guitar has; null/"" = back to the body's name
    name: b.name === undefined ? undefined : cleanGuitarName(b.name),
    idToken: typeof b.idToken === "string" ? b.idToken : "",
    itemId: typeof b.itemId === "string" ? b.itemId : null,
    loadout,
    stickers,
  };
}

/** The stash this build may draw on: loose parts, plus — on a rebuild — the
 *  parts already on the guitar, which go back to the stash first. */
function stashFor(
  arsenal: Partial<ArsenalUserData> | undefined,
  itemId: string | null,
) {
  const loose: OwnedComponent[] = arsenal?.components ?? [];
  const item = itemId
    ? (arsenal?.inventory ?? []).find((i) => i.id === itemId)
    : undefined;
  if (itemId && !item?.custom)
    return { error: "That guitar can't be rebuilt" as const };
  return { loose, item, stash: [...loose, ...(item?.custom?.parts ?? [])] };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { idToken, itemId, loadout, stickers, name } = readRequest(req.body);
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });

  let userId: string;
  try {
    userId = (await auth.verifyIdToken(idToken)).uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userRef = firestore
    .collection("users")
    .doc(userId) as DocumentReference;
  const bucket = getStorage().bucket(
    process.env.NEXT_PUBLIC_FIREBASE_CONFIG_STORAGEBUCKET,
  );
  const token = randomUUID().replace(/-/g, "");
  const file = bucket.file(`${CUSTOM_GUITAR_FOLDER}/${token}.webp`);

  // Check first, render second: a refused build should not cost a render.
  // The transaction below checks everything again against fresh data.
  const snapshot = await userRef.get();
  if (!snapshot.exists)
    return res.status(404).json({ error: "User not found" });
  const pre = stashFor(snapshot.data()?.arsenal, itemId);
  if ("error" in pre) return res.status(400).json({ error: pre.error });
  const preCheck = checkBuild(pre.stash, loadout, stickers, MAX_STICKERS);
  if (!preCheck.ok) return res.status(400).json({ error: preCheck.error });

  try {
    const image = await renderGuitarImage(
      toGuitarBuild(pre.stash, loadout, stickers, STOCK_PARTS),
      originOf(req),
    );
    await file.save(image, {
      contentType: "image/webp",
      metadata: {
        cacheControl: "public, max-age=31536000, immutable",
        // The token is the URL's access key — see customGuitarImageSrc.
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });
  } catch (error) {
    console.error("[build-guitar] render/upload", error);
    return res.status(500).json({ error: "Couldn't render the guitar" });
  }

  try {
    const result = await firestore.runTransaction(async (t: Transaction) => {
      const doc = await t.get(userRef);
      const data = doc.data()!;
      const arsenal = data.arsenal as Partial<ArsenalUserData> | undefined;
      const current = stashFor(arsenal, itemId);
      if ("error" in current) throw new Error(`${REFUSED}${current.error}`);
      const check = checkBuild(current.stash, loadout, stickers, MAX_STICKERS);
      if (!check.ok) throw new Error(`${REFUSED}${check.error}`);

      const oldLevel = current.item?.custom?.level;
      const fameCost =
        oldLevel === undefined
          ? buildFameCost(check.level)
          : rebuildFameCost(oldLevel, check.level);
      const fame: number = data.statistics?.fame || 0;
      if (fame < fameCost) throw new Error(`${REFUSED}Not enough Fame Points`);

      const used = new Set(check.used.map((part) => part.uid));
      const components = current.stash
        .filter((part) => !used.has(part.uid))
        .map((part) => ({ ...part, isNew: false }));
      const bodyKey = toGuitarBuild(
        current.stash,
        loadout,
        [],
        STOCK_PARTS,
      ).bodyKey;
      const custom = {
        level: check.level,
        parts: check.used.map((part) => ({ ...part, isNew: false })),
        loadout,
        stickers,
      };
      const keptName = current.item
        ? parseCustomGuitarId(current.item.guitarId)?.name
        : null;
      const guitarId = customGuitarId({
        rarity: check.rarity,
        bodyKey,
        token,
        name: name === undefined ? keptName : name,
      });

      const inventory: InventoryItem[] = [...(arsenal?.inventory ?? [])];
      let item: InventoryItem;
      if (current.item) {
        item = { ...current.item, guitarId, custom };
        inventory[inventory.findIndex((i) => i.id === current.item!.id)] = item;
      } else {
        item = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          guitarId,
          acquiredAt: Date.now(),
          isNew: true,
          year: 2026,
          country: "USA",
          condition: BUILT_CONDITION,
          mintCondition: BUILT_CONDITION,
          custom,
        };
        inventory.push(item);
      }

      // A rebuilt guitar that was the equipped one stays equipped, under its new id.
      const equippedGuitarId =
        current.item && arsenal?.equippedItemId === current.item.id
          ? guitarId
          : (arsenal?.equippedGuitarId ?? null);
      const rigLevel = getRigLevel({
        inventory,
        effectInventory: arsenal?.effectInventory ?? [],
        rig: arsenal?.rig ?? DEFAULT_RIG,
      });

      const onProfile =
        current.item && arsenal?.equippedItemId === current.item.id;
      t.update(userRef, {
        ...(onProfile
          ? { selectedGuitar: customGuitarDefinition(guitarId)!.imageId }
          : {}),
        "statistics.fame": fame - fameCost,
        "arsenal.components": components,
        "arsenal.inventory": inventory,
        "arsenal.equippedGuitarId": equippedGuitarId,
        rigLevel,
      });
      return {
        item,
        components,
        fameSpent: fameCost,
        newFame: fame - fameCost,
        oldToken: current.item
          ? parseCustomGuitarId(current.item.guitarId)?.token
          : null,
      };
    });

    if (result.oldToken) {
      bucket
        .file(`${CUSTOM_GUITAR_FOLDER}/${result.oldToken}.webp`)
        .delete({ ignoreNotFound: true })
        .catch(() => undefined);
    }
    const { oldToken: _old, ...body } = result;
    return res.status(200).json(body);
  } catch (error: unknown) {
    // The render went up for a build that didn't happen.
    file.delete({ ignoreNotFound: true }).catch(() => undefined);
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith(REFUSED)) {
      return res.status(400).json({ error: message.slice(REFUSED.length) });
    }
    console.error("[build-guitar]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
