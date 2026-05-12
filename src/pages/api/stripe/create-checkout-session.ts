import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { auth, firestore } from "utils/firebase/api/firebase.config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

const PRICE_IDS = {
  pro: {
    monthly: process.env.STRIPE_PRO_PRICE_ID_MONTHLY!,
    yearly: process.env.STRIPE_PRO_PRICE_ID_YEARLY!,
  },
  master: {
    monthly: process.env.STRIPE_MASTER_PRICE_ID_MONTHLY!,
    yearly: process.env.STRIPE_MASTER_PRICE_ID_YEARLY!,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, plan, billing, trial } = req.body as {
    idToken: string;
    plan?: "pro" | "master";
    billing?: "monthly" | "yearly";
    trial?: boolean;
  };

  if (!idToken) return res.status(400).json({ error: "Missing idToken" });

  const selectedPlan = plan ?? "pro";
  const selectedBilling = billing ?? "monthly";
  const priceId = PRICE_IDS[selectedPlan][selectedBilling];

  if (!priceId) {
    return res.status(400).json({ error: `Missing price ID for ${selectedPlan}/${selectedBilling}` });
  }

  // Verify Firebase identity
  let userId: string;
  let userEmail: string | undefined;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
    userEmail = decoded.email;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (trial) {
    const userDoc = await firestore.collection("users").doc(userId).get();
    if (userDoc.data()?.hadTrial) {
      return res.status(400).json({ error: "Trial already used" });
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: { userId },
      subscription_data: {
        metadata: { userId, plan: selectedPlan },
        ...(trial ? { trial_period_days: 7 } : {}),
      },
      customer_email: userEmail,
      success_url: `${APP_URL}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/premium/cancel`,
      allow_promotion_codes: true,
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return res.status(500).json({ error: error.message });
  }
}
