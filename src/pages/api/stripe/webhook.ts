import type { NextApiRequest, NextApiResponse } from "next";
import { Readable } from "stream";
import Stripe from "stripe";
import * as admin from "firebase-admin";
import { firestore } from "utils/firebase/api/firebase.config";

// Disable Next.js body parsing — Stripe needs the raw body to verify signature
export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

/** Read the raw request body as a Buffer */
async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req as unknown as Readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/** Grant premium to a Firebase user */
async function grantPremium(
  userId: string,
  stripeCustomerId: string | null,
  stripeSubscriptionId: string | null,
  premiumUntil: string | null,
  plan: "pro" | "master" = "pro"
) {
  await firestore.collection("users").doc(userId).update({
    role: plan,
    premiumUntil,
    stripeCustomerId,
    stripeSubscriptionId,
  });
}

/** Revoke premium from a Firebase user */
async function revokePremium(userId: string) {
  await firestore.collection("users").doc(userId).update({
    role: "user",
    premiumUntil: admin.firestore.FieldValue.delete(),
    stripeSubscriptionId: admin.firestore.FieldValue.delete(),
  });
}

/** Get subscription period end — Stripe API 2024-09-30+ moved this to items */
function getPeriodEnd(sub: Stripe.Subscription): number | undefined {
  return (sub as any).current_period_end ?? sub.items?.data?.[0]?.current_period_end;
}

/** Find userId from a Stripe customer ID (fallback lookup) */
async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  const snap = await firestore
    .collection("users")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();
  return snap.empty ? null : snap.docs[0].id;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) return res.status(400).json({ error: "Missing stripe-signature" });

  let event: Stripe.Event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {
      // ── Initial purchase ─────────────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (!userId) break;

        let premiumUntil: string | null = null;
        let plan: "pro" | "master" = "pro";
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          const periodEnd = getPeriodEnd(sub);
          premiumUntil = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
          if (sub.metadata?.plan === "master") plan = "master";
        }

        await grantPremium(
          userId,
          session.customer as string | null,
          session.subscription as string | null,
          premiumUntil,
          plan
        );

        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          if (sub.status === "trialing") {
            await firestore.collection("users").doc(userId).update({ hadTrial: true });
          }
        }
        break;
      }

      // ── Subscription updated (renewal, plan change) ──────────────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId =
          sub.metadata?.userId ||
          (await getUserIdFromCustomer(sub.customer as string));
        if (!userId) break;

        const periodEnd = getPeriodEnd(sub);
        const premiumUntil = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
        const plan: "pro" | "master" = sub.metadata?.plan === "master" ? "master" : "pro";

        if (sub.status === "active" || sub.status === "trialing") {
          await grantPremium(
            userId,
            sub.customer as string,
            sub.id,
            premiumUntil,
            plan
          );
        } else {
          await revokePremium(userId);
        }
        break;
      }

      // ── Subscription deleted / payment failed → revoke ────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId =
          sub.metadata?.userId ||
          (await getUserIdFromCustomer(sub.customer as string));
        if (!userId) break;
        await revokePremium(userId);
        break;
      }

      // ── Invoice paid → extend premiumUntil ────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceSubId = invoice.parent?.subscription_details?.subscription;
        if (!invoiceSubId) break;

        const sub = await stripe.subscriptions.retrieve(
          invoiceSubId as string
        );
        const userId =
          sub.metadata?.userId ||
          (await getUserIdFromCustomer(sub.customer as string));
        if (!userId) break;

        const periodEnd2 = getPeriodEnd(sub);
        const premiumUntil = periodEnd2 ? new Date(periodEnd2 * 1000).toISOString() : null;
        const plan2: "pro" | "master" = sub.metadata?.plan === "master" ? "master" : "pro";
        await grantPremium(
          userId,
          sub.customer as string,
          sub.id,
          premiumUntil,
          plan2
        );
        break;
      }

      // ── Invoice payment failed ────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceSubId = invoice.parent?.subscription_details?.subscription;
        if (!invoiceSubId) break;

        const sub = await stripe.subscriptions.retrieve(
          invoiceSubId as string
        );
        const userId =
          sub.metadata?.userId ||
          (await getUserIdFromCustomer(sub.customer as string));
        if (!userId) break;

        // Keep access until end of current period (Stripe will retry)
        // You could notify the user here via email / in-app notification
        console.warn(`Payment failed for user ${userId}`);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }

  return res.status(200).json({ received: true });
}
