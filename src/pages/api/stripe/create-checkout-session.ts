import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { auth } from "utils/firebase/api/firebase.config";

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

  const { idToken, plan } = req.body as { idToken: string; plan?: "monthly" | "yearly" };
  if (!idToken) return res.status(400).json({ error: "Missing idToken" });

  const priceId =
    plan === "yearly"
      ? process.env.STRIPE_PREMIUM_PRICE_ID_YEARLY!
      : process.env.STRIPE_PREMIUM_PRICE_ID!;

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
      // Embed userId in both session and subscription metadata
      metadata: { userId },
      subscription_data: {
        metadata: { userId },
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
