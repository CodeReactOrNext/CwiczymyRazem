import { readGuilds } from "lib/guild/guilds";
import { depositFame } from "lib/guild/guildTreasury";
import { requirePlayer } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Putting Fame into the guild's own.
 *
 * Open to any member rather than supporters only, and deliberately so: Fame is
 * earned by practising, so a member who has never donated a penny can still be
 * the one who paid for the guild's next challenge tier.
 *
 * Which guild the Fame lands in comes from the caller's own `guildId`, an
 * Admin-SDK-written field, never from the body; the charge happens inside the
 * transaction that credits it, against the stored balance. Spending the
 * treasury is somewhere else — see `challenge.ts` — because putting in and
 * taking out are not the same permission.
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

  const { action, amount } = (req.body ?? {}) as {
    action?: string;
    amount?: unknown;
  };
  if (action !== "deposit") {
    return res.status(400).json({ error: "Unknown action" });
  }

  try {
    const result = await depositFame(authResult.session, amount);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(200).json({
      ...(await readGuilds(authResult.session)),
      paid: result.paid,
    });
  } catch (error: any) {
    console.error("[supporter/guild/treasury]", error);
    return res.status(500).json({ error: "Could not put that in" });
  }
}
