import { readGuilds } from "lib/guild/guilds";
import { requirePlayer } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Every guild, plus which one the caller is in. Open to any signed-in player:
 * founding is the supporter perk, belonging is not — a guild only supporters
 * could enter would be a club of one.
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
    return res.status(200).json(await readGuilds(authResult.session));
  } catch (error: any) {
    console.error("[supporter/guild]", error);
    return res.status(500).json({ error: "Failed to load the guilds" });
  }
}
