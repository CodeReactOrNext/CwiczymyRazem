import { pickDiscordPromoVariant } from "feature/logs/content/discordPromoVariants";
import type { FirebaseLogsDiscordPromoInterface } from "feature/logs/types/logs.type";
import * as admin from "firebase-admin";
import type { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * Days between two Discord cards. The cron fires every morning; most mornings
 * it finds the last card too recent and does nothing, so the feed sees one
 * every few days instead of a daily ad.
 */
export const DISCORD_PROMO_EVERY_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole UTC days between two `YYYY-MM-DD` keys. */
const daysBetween = (from: string, to: string): number =>
  Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);

/** Puts the occasional "join our Discord" card in the activity feed. Runs from a Vercel cron. */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const authHeader = req.headers.authorization;
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const metaRef = firestore.collection("meta").doc("discordPromoFeed");
    const metaSnap = await metaRef.get();
    const meta = metaSnap.exists ? (metaSnap.data() ?? {}) : {};

    // `?force=1` is for trying the copy out, and only counts behind a configured secret —
    // otherwise the route would be an open "post another ad" button.
    const today = new Date().toISOString().slice(0, 10);
    const force = Boolean(process.env.CRON_SECRET) && req.query.force === "1";
    const lastPostedDay =
      typeof meta.lastPostedDay === "string" ? meta.lastPostedDay : null;
    if (
      !force &&
      lastPostedDay &&
      daysBetween(lastPostedDay, today) < DISCORD_PROMO_EVERY_DAYS
    ) {
      return res.status(200).json({ posted: false, reason: "too soon" });
    }

    const shownCount = Number(meta.shownCount ?? 0);
    const variant = pickDiscordPromoVariant(shownCount);
    const now = new Date().toISOString();
    const row: FirebaseLogsDiscordPromoInterface = {
      type: "discord_promo",
      variant,
      // Plain ISO strings, like every other `logs` writer — the feed orders by `timestamp`.
      data: now,
      timestamp: now,
    };

    await firestore.collection("logs").add(row);
    await metaRef.set(
      {
        shownCount: shownCount + 1,
        lastPostedDay: today,
        lastPostedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return res.status(200).json({ posted: true, variant });
  } catch (error) {
    console.error("Error posting the Discord promo:", error);
    return res.status(500).json({ message: "Error posting the Discord promo" });
  }
}
