import {
  applyToGuild,
  decideApplication,
  withdrawApplication,
} from "lib/guild/guildApplications";
import { leaveGuild, readGuilds } from "lib/guild/guilds";
import { requirePlayer } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Everything that moves a person in or out of a guild.
 *
 * Nobody seats themselves any more: a player applies, the founder decides. The
 * founder check lives in `decideApplication`, against the guild document rather
 * than anything the caller sent.
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

  const session = authResult.session;

  try {
    const { action, guildId, applicantUid, message } = req.body as {
      action?: "apply" | "withdraw" | "accept" | "reject" | "leave";
      guildId?: string;
      applicantUid?: string;
      message?: string;
    };

    let result;
    switch (action) {
      case "apply":
        result = await applyToGuild(session, guildId ?? "", message ?? "");
        break;
      case "withdraw":
        result = await withdrawApplication(session, guildId ?? "");
        break;
      case "accept":
      case "reject":
        result = await decideApplication(
          session,
          guildId ?? "",
          applicantUid ?? "",
          action === "accept",
        );
        break;
      case "leave":
        result = await leaveGuild(session);
        break;
      default:
        return res.status(400).json({ error: "Unknown action" });
    }

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(200).json(await readGuilds(session));
  } catch (error: any) {
    console.error("[supporter/guild/membership]", error);
    return res.status(500).json({ error: "Failed to update your membership" });
  }
}
