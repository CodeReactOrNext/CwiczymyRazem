import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { auth, firestore } from "utils/firebase/api/firebase.config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

const MASTER_PRICE_IDS = {
  monthly: process.env.STRIPE_MASTER_PRICE_ID_MONTHLY!,
  yearly: process.env.STRIPE_MASTER_PRICE_ID_YEARLY!,
};

function getAppUrl(req: NextApiRequest) {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  const proto = (req.headers["x-forwarded-proto"] as string) || "http";
  const host = req.headers["x-forwarded-host"] as string || req.headers["host"] as string;
  return `${proto}://${host}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { idToken, billing } = req.body as { idToken: string; billing?: "monthly" | "yearly" };
  if (!idToken) return res.status(400).json({ error: "Missing idToken" });

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userDoc = await firestore.collection("users").doc(userId).get();
  const userData = userDoc.data();

  if (!userData?.stripeSubscriptionId) {
    return res.status(400).json({ error: "No active subscription found" });
  }
  if (userData?.role === "master") {
    return res.status(400).json({ error: "Already on Practice Master" });
  }
  if (!userData?.stripeCustomerId) {
    return res.status(400).json({ error: "No Stripe customer found" });
  }

  const selectedBilling: "monthly" | "yearly" = billing ?? "monthly";
  const newPriceId = MASTER_PRICE_IDS[selectedBilling];
  if (!newPriceId) {
    return res.status(400).json({ error: `Missing price ID for master/${selectedBilling}` });
  }

  try {
    const sub = await stripe.subscriptions.retrieve(userData.stripeSubscriptionId);
    const itemId = sub.items.data[0]?.id;
    if (!itemId) return res.status(500).json({ error: "Could not find subscription item" });

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: userData.stripeCustomerId,
      return_url: `${getAppUrl(req)}/`,
      flow_data: {
        type: "subscription_update_confirm",
        subscription_update_confirm: {
          subscription: userData.stripeSubscriptionId,
          items: [{ id: itemId, price: newPriceId, quantity: 1 }],
        },
      },
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (error: any) {
    console.error("Stripe upgrade error:", error);
    return res.status(500).json({ error: error.message });
  }
}
