import { foundGuild, readGuilds } from "lib/guild/guilds";
import { requireSupporter } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Founds a guild for tokens. Supporters only — this is the thing the donation
 * buys. The name and the tag are claimed as document ids inside the same
 * transaction that charges the wallet, so two founders racing for one name
 * cannot both come away with it, and the loser is not charged.
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

  try {
    const { name, tag, description, logo } = req.body as {
      name?: string;
      tag?: string;
      description?: string;
      logo?: string | null;
    };

    const result = await foundGuild(authResult.session, {
      name,
      tag,
      description,
      logo,
    });
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res
      .status(200)
      .json(await readGuilds({ ...authResult.session, isSupporter: true }));
  } catch (error: any) {
    console.error("[supporter/guild/found]", error);
    return res.status(500).json({ error: "Failed to found the guild" });
  }
}
