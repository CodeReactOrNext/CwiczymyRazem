import type { PartId, PartTier } from "feature/arsenal/types/arsenal.types";
import type {
  StashDeposit,
  StashItemKind,
} from "feature/guilds/types/stash.types";
import { depositItem, readStash, takeItem } from "lib/guild/guildStash";
import { requirePlayer } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * Reads what the request is asking to leave on the shelf.
 *
 * Nothing here is trusted beyond its shape — every id, tier and amount is
 * checked against what the member actually holds inside the transaction. This
 * only decides which of the three shapes the body is.
 */
const readDeposit = (body: Record<string, any>): StashDeposit => {
  const kind = body.kind as StashItemKind | undefined;

  if (kind === "part") {
    return {
      kind: "part",
      partId: body.partId as PartId,
      tier: body.tier as PartTier,
      qty: Number(body.qty),
    };
  }
  if (kind === "mod") return { kind: "mod", modId: body.modId ?? "" };

  return {
    kind: kind === "effect" ? "effect" : "guitar",
    inventoryItemId: body.inventoryItemId ?? "",
  };
};

/**
 * The guild's shared shelf: read it, put something on it, take something off.
 * Members only, and membership is re-checked inside every write — the caller's
 * `guildId` is Admin-SDK-written, so it is the one claim worth trusting.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authResult = await requirePlayer(req);
  if (!authResult.ok) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  try {
    const body = (req.body ?? {}) as Record<string, any>;
    const { action, entryId, qty } = body as {
      action?: "deposit" | "take";
      entryId?: string;
      qty?: number;
    };

    const user = await firestore
      .collection("users")
      .doc(authResult.session.uid)
      .get();
    const guildId = user.data()?.guildId as string | undefined;
    if (!guildId) {
      return res.status(403).json({ error: "You are not in a guild" });
    }

    if (action === "deposit") {
      const result = await depositItem(
        authResult.session,
        guildId,
        readDeposit(body),
      );
      if (!result.ok) {
        return res.status(result.status).json({ error: result.error });
      }
    } else if (action === "take") {
      const result = await takeItem(
        authResult.session,
        guildId,
        entryId ?? "",
        qty == null ? undefined : Number(qty),
      );
      if (!result.ok) {
        return res.status(result.status).json({ error: result.error });
      }
    }

    const guild = await firestore.collection("guilds").doc(guildId).get();
    return res
      .status(200)
      .json(await readStash(guildId, guild.data()?.members ?? []));
  } catch (error: any) {
    console.error("[supporter/guild/stash]", error);
    return res.status(500).json({ error: "Failed to reach the stash" });
  }
}
