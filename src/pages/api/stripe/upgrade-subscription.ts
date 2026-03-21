import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { auth, firestore } from "utils/firebase/api/firebase.config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const MASTER_PRICE_IDS = {
  monthly: process.env.STRIPE_MASTER_PRICE_ID_MONTHLY!,
  yearly: process.env.STRIPE_MASTER_PRICE_ID_YEARLY!,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { idToken, billing } = req.body as { idToken: string; billing?: "monthly" | "yearly" };
  if (!idToken) return res.status(400).json({ error: "Missing idToken" });

  // Verify Firebase identity
  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Fetch user data from Firestore
  const userDoc = await firestore.collection("users").doc(userId).get();
  const userData = userDoc.data();

  if (!userData?.stripeSubscriptionId) {
    return res.status(400).json({ error: "No active subscription found" });
  }
  if (userData?.role === "master") {
    return res.status(400).json({ error: "Already on Practice Master" });
  }

  const selectedBilling: "monthly" | "yearly" = billing ?? "monthly";
  const newPriceId = MASTER_PRICE_IDS[selectedBilling];
  if (!newPriceId) {
    return res.status(400).json({ error: `Missing price ID for master/${selectedBilling}` });
  }

  try {
    // Retrieve the current subscription to get the item ID
    const sub = await stripe.subscriptions.retrieve(userData.stripeSubscriptionId);
    const itemId = sub.items.data[0]?.id;
    if (!itemId) return res.status(500).json({ error: "Could not find subscription item" });

    // Update subscription to Master price with proration
    await stripe.subscriptions.update(userData.stripeSubscriptionId, {
      items: [{ id: itemId, price: newPriceId }],
      proration_behavior: "create_prorations",
      metadata: { userId, plan: "master" },
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Stripe upgrade error:", error);
    return res.status(500).json({ error: error.message });
  }
}
