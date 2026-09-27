import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { postWelcomeMessage } from "lib/chat/chatSystemMessages";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/** Only a new account gets a welcome card — an old one finishing onboarding late is no news. */
const WELCOME_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Posts the new player's welcome card to the global room, called when they
 * finish onboarding. Everything on the card comes from their own user document;
 * the request carries nothing but the token. The card's document id is the
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

    await postWelcomeMessage(uid, data, { goal, planTitle });

    return res.status(200).json({ posted: true });
  } catch (error) {
    console.error("[chat/welcome]", error);
    return res.status(500).json({ error: "Could not post the welcome" });
  }
}
