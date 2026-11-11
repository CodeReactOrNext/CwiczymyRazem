import {
  bookRecording,
  claimRecordingPay,
  deliverRecording,
  readGuildRecording,
  readTake,
  submitRecordingTake,
} from "lib/guild/guildRecording";
import { requirePlayer } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Recording sessions: read them (no `action`), book a session on a tier
 * (`action: "book", tier` — the client is drawn), lay down a take (`action: "take"` with
 * `partId`, `accuracy`, `bpm`, `notes`), hand the track over early
 * (`action: "deliver"`) or collect what finished sessions owe
 * (`action: "claim"`).
 *
 * Open to every member, supporters or not — the session is paid for out of
 * the guild's treasury, which every member can fill. Which guild comes from
 * the caller's own `guildId`; fees, limits and payouts are all worked out
 * inside the transaction that applies them.
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
  const { session } = authResult;
  const body = (req.body ?? {}) as Record<string, unknown>;

  try {
    if (body.action === "take") {
      const take = readTake(body);
      if (!take) return res.status(400).json({ error: "Not a take" });
      const laid = await submitRecordingTake(session, take);
      if (!laid.ok) return res.status(laid.status).json({ error: laid.error });
      return res.status(200).json({ view: laid.view, take: laid.take });
    }

    if (body.action === "claim") {
      const paid = await claimRecordingPay(session);
      if (!paid.ok) return res.status(paid.status).json({ error: paid.error });
      return res.status(200).json({ view: paid.view, fame: paid.fame });
    }

    const result =
      body.action === "book"
        ? await bookRecording(session, body.tier)
        : body.action === "deliver"
          ? await deliverRecording(session)
          : body.action === undefined
            ? await readGuildRecording(session)
            : null;
    if (!result) return res.status(400).json({ error: "Unknown action" });
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(200).json({ view: result.view });
  } catch (error: any) {
    console.error("[supporter/guild/recording]", error);
    return res.status(500).json({ error: "Could not open the session" });
  }
}
