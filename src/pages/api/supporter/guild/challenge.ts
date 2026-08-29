import { claimChallengeReward } from "lib/guild/guildChallenge";
import { readGuilds } from "lib/guild/guilds";
import { buyChallengeTier } from "lib/guild/guildTreasury";
import { requirePlayer } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * The guild's challenge: taking this week's Fame, and moving up the ladder.
 *
 * Two actions with deliberately different permissions. `claim` is open to every
 * member, because the tier pays the people who actually practised and whoever
 * put the week in is the one who collects. `buyTier` is the founder's alone: it
 * spends the guild's Fame *and* moves everybody's weekly target up, which is
 * not a thing one member should be able to commit the roster to.
 *
 * Nothing about either comes from the body beyond which action. The guild is
 * the caller's own `guildId` (an Admin-SDK-written field); the tier, its price
 * and the payout are all read from the stored guild document inside the
 * transaction that writes them.
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
  if (action !== "claim" && action !== "buyTier") {
    return res.status(400).json({ error: "Unknown action" });
  }

  try {
    if (action === "buyTier") {
      const bought = await buyChallengeTier(authResult.session);
      if (!bought.ok) {
        return res.status(bought.status).json({ error: bought.error });
      }

      return res.status(200).json({
        ...(await readGuilds(authResult.session)),
        tierName: bought.name,
        spent: bought.spent,
      });
    }

    const result = await claimChallengeReward(authResult.session);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    // The whole state comes back with the Fame already spent-able, plus what
    // was actually paid, which is the only thing the toast needs.
    return res.status(200).json({
      ...(await readGuilds(authResult.session)),
      fame: result.fame,
    });
  } catch (error: any) {
    console.error("[supporter/guild/challenge]", error);
    return res
      .status(500)
      .json({ error: "Could not do that with the challenge" });
  }
}
