import {
  buyBoardSkin,
  readSkinShop,
  wearBoardSkin,
} from "lib/support/boardSkinShop";
import { requireSupporter } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * The rig skin shop. Supporters only: skins are bought with tokens.
 *
 * One route, three things it can be asked: what the account owns (`read`), to
 * buy a skin (`buy`), or to change which one is worn (`wear`) — for a display
 * case, in which `bays` of the guitar wall. Each
 * answers with the wallet and the skins as they now stand, so the client
 * renders what came back instead of keeping a tally of its own.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authResult = await requireSupporter(req);
  if (!authResult.ok) {
    return res.status(authResult.status).json({ error: authResult.error });
  }
  const { uid } = authResult.session;

  try {
    const { action, skinId, kind, bays } = (req.body ?? {}) as {
      action?: string;
      skinId?: unknown;
      kind?: unknown;
      bays?: unknown;
    };

    if (action === "read") {
      return res.status(200).json(await readSkinShop(uid));
    }
    if (action !== "buy" && action !== "wear") {
      return res.status(400).json({ error: "Unknown action" });
    }

    const result =
      action === "buy"
        ? await buyBoardSkin(uid, skinId, bays)
        : await wearBoardSkin(uid, kind, skinId ?? null, bays);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res
      .status(200)
      .json({ wallet: result.wallet, boardSkins: result.boardSkins });
  } catch (error: unknown) {
    console.error("[supporter/skins]", error);
    return res.status(500).json({ error: "Failed to reach the skin shop" });
  }
}
