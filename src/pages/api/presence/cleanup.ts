import { database } from "utils/firebase/api/firebase.config";
import type { NextApiRequest, NextApiResponse } from "next";

const ONE_HOUR_MS = 60 * 60 * 1000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const statusRef = database.ref("status");
    const snapshot = await statusRef.once("value");
    const val = snapshot.val();

    if (!val) {
      return res.status(200).json({ cleaned: 0 });
    }

    const cutoff = Date.now() - ONE_HOUR_MS;
    const staleUids: string[] = [];

    for (const [uid, data] of Object.entries(val as Record<string, { last_changed: number }>)) {
      if (data.last_changed < cutoff) {
        staleUids.push(uid);
      }
    }

    if (staleUids.length === 0) {
      return res.status(200).json({ cleaned: 0 });
    }

    const updates: Record<string, null> = {};
    for (const uid of staleUids) {
      updates[uid] = null;
    }

    await statusRef.update(updates);

    return res.status(200).json({ cleaned: staleUids.length });
  } catch (error) {
    console.error("[presence/cleanup] error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
