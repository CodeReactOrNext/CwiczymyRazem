import { claimQuestRewards } from "lib/guild/guildQuests";
import { readGuilds } from "lib/guild/guilds";
import { requirePlayer } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * The guild's quests: taking the Fame they have paid out.
 *
 * One action, open to every member, because a quest pays the people who were
 * on the roster when the guild cleared it and whoever earned it is the one who
 * collects. Nothing comes from the body beyond which action: the guild is the
 * caller's own `guildId` (an Admin-SDK-written field), and which quests are
 * cleared, which they were there for and which they have already taken are
 * all read from the stored guild document inside the transaction that pays.
 *
 * There is nothing to buy here. Quests are cleared by practising, and the
 * board is measured — and banked — on every read of the guild.
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

  const { action } = (req.body ?? {}) as { action?: string };
  if (action !== "claim") {
    return res.status(400).json({ error: "Unknown action" });
  }

  try {
    const result = await claimQuestRewards(authResult.session);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    // The whole state comes back with the Fame already spend-able, plus what
    // was actually paid, which is the only thing the toast needs.
    return res.status(200).json({
      ...(await readGuilds(authResult.session)),
      fame: result.fame,
      quests: result.quests,
    });
  } catch (error: any) {
    console.error("[supporter/guild/quests]", error);
    return res.status(500).json({ error: "Could not take that" });
  }
}
