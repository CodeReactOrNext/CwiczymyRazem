import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { auth, firestore } from "utils/firebase/api/firebase.config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken } = req.body as { idToken: string };
  if (!idToken) return res.status(400).json({ error: "Missing idToken" });

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userDoc = await firestore.collection("users").doc(userId).get();
    const stripeCustomerId = userDoc.data()?.stripeCustomerId as string | undefined;

    if (!stripeCustomerId) {
      return res.status(400).json({ error: "No Stripe customer found" });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${APP_URL}/settings`,
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (error: any) {
    console.error("Customer portal error:", error);
    return res.status(500).json({ error: error.message });
  }
}
