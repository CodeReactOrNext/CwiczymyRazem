import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import type { FirebaseLogsPlayerJoinedInterface } from "feature/logs/types/logs.type";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/** Only a new account gets a welcome row — an old one finishing onboarding late is no news. */
const WELCOME_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Firestore's gRPC code for a document that already exists. */
const ALREADY_EXISTS = 6;

/**
 * Puts the new player's "joined" row in the activity feed, called when they
 * finish onboarding. Everything on the row comes from their own user document;
 * the request carries nothing but the token. The row's document id is the
 * player's, so a second call — a double click, a retry — posts nothing.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken } = (req.body ?? {}) as { idToken?: string };
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });

  let uid: string;
  try {
    uid = (await auth.verifyIdToken(idToken)).uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const record = await auth.getUser(uid);
    const createdAt = Date.parse(record.metadata.creationTime);
    if (!Number.isFinite(createdAt) || Date.now() - createdAt > WELCOME_WINDOW_MS) {
      return res.status(200).json({ posted: false });
    }

    const user = await firestore.collection("users").doc(uid).get();
    const data = user.data();
    if (!data) return res.status(404).json({ error: "User not found" });

    const goal =
      typeof data.onboarding?.goal === "string" ? data.onboarding.goal : null;
    const planId =
      typeof data.onboarding?.planId === "string" ? data.onboarding.planId : null;
    const planTitle = planId
      ? (defaultPlans.find((plan) => plan.id === planId)?.title ?? null)
      : null;

    const now = new Date().toISOString();
    const row: FirebaseLogsPlayerJoinedInterface = {
      type: "player_joined",
      uid,
      userName: data.displayName || "Player",
      avatarUrl: data.avatar ?? null,
      userAvatarFrame: data.statistics?.lvl ?? 0,
      guildBadge: data.guildBadge ?? null,
      goal,
      planTitle,
      // Plain ISO strings, like every other `logs` writer — the feed orders by `timestamp`.
      data: now,
      timestamp: now,
    };

    try {
      await firestore.collection("logs").doc(`welcome-${uid}`).create(row);
    } catch (error) {
      if ((error as { code?: unknown })?.code === ALREADY_EXISTS) {
        return res.status(200).json({ posted: false });
      }
      throw error;
    }

    return res.status(200).json({ posted: true });
  } catch (error) {
    console.error("[logs/player-joined]", error);
    return res.status(500).json({ error: "Could not post the welcome" });
  }
}
