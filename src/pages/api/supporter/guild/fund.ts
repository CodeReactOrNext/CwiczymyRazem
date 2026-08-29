import { isGuildUpgrade } from "feature/guilds/utils/guildUpgrades.utils";
import { fundUpgrade } from "lib/guild/guildFunding";
import { readGuilds } from "lib/guild/guilds";
import { requirePlayer } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Puts a contribution into one of the caller's guild's pots: more seats,
 * another row on the shelf, or a step up the challenge ladder.
 *
 * Open to any member rather than supporters only — the room belongs to the
 * guild, and whoever is standing in it with something to spare should be able
 * to make it bigger. Which guild that is comes from the caller's own `guildId`,
 * an Admin-SDK-written field, never from the body; the price, the wallet it
 * comes out of (tokens for room, Fame for a harder week) and the amount
 * actually taken are all worked out inside the transaction that charges it.
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

  const { track, tokens } = (req.body ?? {}) as {
    track?: unknown;
    tokens?: unknown;
  };
  if (!isGuildUpgrade(track)) {
    return res.status(400).json({ error: "Nothing to put that towards" });
  }

  try {
    const result = await fundUpgrade(authResult.session, track, Number(tokens));
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    // The whole state comes back, plus the two things the toast needs: what was
    // actually taken (a contribution is clamped to what was still owed) and
    // whether this is the one that bought the step.
    return res.status(200).json({
      ...(await readGuilds(authResult.session)),
      paid: result.paid,
      unlocked: result.unlocked,
    });
  } catch (error: any) {
    console.error("[supporter/guild/fund]", error);
    return res.status(500).json({ error: "Could not put that in" });
  }
}
