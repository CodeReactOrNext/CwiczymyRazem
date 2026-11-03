import {
  buyStudioStep,
  readGuildStudio,
  readPurchase,
} from "lib/guild/guildStudio";
import { requirePlayer } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * The guild studio: read it (no `action`), or buy its next step
 * (`action: "buy"` with `kind: "room"` or `kind: "item", id`).
 *
 * Open to every member, supporters or not — the room is paid for out of the
 * guild's treasury, which every member can fill. Which guild comes from the
 * caller's own `guildId`; the price and whether it can be paid are worked out
 * inside the transaction that charges it.
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

  const body = (req.body ?? {}) as Record<string, unknown>;

  try {
    if (body.action === "buy") {
      const purchase = readPurchase(body);
      if (!purchase) {
        return res.status(400).json({ error: "Nothing to buy" });
      }
      const bought = await buyStudioStep(authResult.session, purchase);
      if (!bought.ok) {
        return res.status(bought.status).json({ error: bought.error });
      }
    } else if (body.action !== undefined) {
      return res.status(400).json({ error: "Unknown action" });
    }

    const state = await readGuildStudio(authResult.session);
    if (!state.ok) {
      return res.status(state.status).json({ error: state.error });
    }
    return res.status(200).json({
      studio: state.studio,
      bank: state.bank,
      week: state.week,
      weekStart: state.weekStart,
    });
  } catch (error: any) {
    console.error("[supporter/guild/studio]", error);
    return res.status(500).json({ error: "Could not open the studio" });
  }
}
