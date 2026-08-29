import { equipCosmetic } from "lib/guild/guildCosmetics";
import { readGuilds } from "lib/guild/guilds";
import { requirePlayer } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Changing what a guild wears.
 *
 * Open to any signed-in player rather than supporters only — and refused for
 * everyone but the founder inside `equipCosmetic`, which is the only place the
 * caller's uid can be held against the guild's. Which guild that is comes from
 * the caller's own `guildId`, an Admin-SDK-only field, never from the body.
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
    const { itemId } = req.body as { itemId?: unknown };

    const result = await equipCosmetic(authResult.session, itemId);

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(200).json(await readGuilds(authResult.session));
  } catch (error: any) {
    console.error("[supporter/guild/cosmetics]", error);
    return res.status(500).json({ error: "Failed to change the guild's kit" });
  }
}
