import crypto from "crypto";
import { logger } from "feature/logger/Logger";
import * as admin from "firebase-admin";
import {
  findDonorAccountByEmail,
  grantSupporterByEmail,
} from "lib/support/supporterGrant";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Readable } from "stream";
import { firestore } from "utils/firebase/api/firebase.config";

// BMC needs the raw body so we can verify the signature.
export const config = { api: { bodyParser: false } };

/** Candidate header names BMC may use for the verification signature. */
const SIGNATURE_HEADERS = ["x-signature-sha256", "x-bmc-signature", "signature"];

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req as unknown as Readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Verify the request came from BMC. Returns true when valid OR when no secret
 * is configured yet (so the endpoint works before it's locked down). Once
 * `BMC_WEBHOOK_SECRET` is set and BMC sends a signature header, it must match.
 */
function isAuthentic(req: NextApiRequest, rawBody: Buffer): boolean {
  const secret = process.env.BMC_WEBHOOK_SECRET;
  if (!secret) return true;

  const header = SIGNATURE_HEADERS.map((h) => req.headers[h]).find(Boolean);
  if (!header) {
    logger.warn("BMC webhook: secret set but no signature header found", {
      context: "bmcWebhook",
      extra: { headers: Object.keys(req.headers) },
    });
    return true; // don't lock out while confirming the header name
  }

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const got = String(header).toLowerCase();
  return got === expected;
}

const num = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const truthy = (v: unknown): boolean => v === true || v === "true";

/** The contribution amount (excludes BMC fees in total_amount_charged). */
function extractAmount(data: Record<string, any>): number {
  const direct = num(data.amount);
  if (direct > 0) return direct;
  const computed = num(data.coffee_count ?? 1) * num(data.coffee_price);
  return computed > 0 ? computed : 0;
}

const TS = () => admin.firestore.FieldValue.serverTimestamp();

/** BMC labels the donor's address differently per event type; take whichever came. */
function extractEmail(data: Record<string, any>): string | null {
  return data.supporter_email ?? data.payer_email ?? data.email ?? null;
}

/** Posts a celebratory card into the shared Activity feed — same broadcast pattern as
 * the support-ask cron (everyone sees it). When the donor's address belongs to an account,
 * that account is stamped onto the log: the feed then pins the card to the top of the day
 * and lets other players motivate it, which is what turns the donation into Fame. Never
 * throws: a failure here shouldn't turn a successfully-recorded donation into a 500 for
 * BMC's retry logic. */
async function postDonationActivity(
  data: Record<string, any>,
  amount: number,
  kind: "one_off" | "recurring"
): Promise<void> {
  try {
    // The email never reaches the feed — only the account it resolved to does.
    const donor = await findDonorAccountByEmail(extractEmail(data));

    await firestore.collection("logs").add({
      type: "donation_received",
      data: new Date().toISOString(),
      supporterName: data.supporter_name ?? null,
      amount,
      kind,
      ...(donor ?? {}),
      // The `logs` collection's `timestamp` field is a plain ISO string
      // everywhere else it's written (see addQuestLog/addSongsLog/etc. and
      // daily-top-players.ts) — a real Firestore Timestamp here would sort
      // as a different value type in `orderBy("timestamp", "desc")` and get
      // pushed out of the feed's `limit(20)` window.
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.warn("Failed to post donation Activity card", {
      context: "bmcWebhook",
      extra: { error: error instanceof Error ? error.message : String(error) },
    });
  }
}

/** Turns the donation into the supporter badge. Anonymous donations carry no
 * address and are skipped; an address with no account behind it yet is parked
 * until that person logs in. Never throws — a badge is a thank-you, not a
 * reason to make BMC retry a donation that was already recorded. */
async function grantSupporterBadge(
  data: Record<string, any>,
  type: string
): Promise<void> {
  try {
    const outcome = await grantSupporterByEmail({
      email: extractEmail(data),
      supporterName: data.supporter_name ?? null,
      amount: extractAmount(data),
    });
    logger.info(`BMC supporter badge: ${outcome.status}`, {
      context: "bmcWebhook",
      extra: { type, status: outcome.status },
    });
  } catch (error) {
    logger.warn("Failed to grant the supporter badge", {
      context: "bmcWebhook",
      extra: { error: error instanceof Error ? error.message : String(error) },
    });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let event: { type?: string; event_id?: string | number; created?: number; data?: any };
  let rawBody: Buffer;
  try {
    rawBody = await getRawBody(req);
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return res.status(400).json({ error: "Invalid body" });
  }

  if (!isAuthentic(req, rawBody)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const type = event.type ?? "unknown";
  const data = event.data ?? {};
  const created = num(event.created) || Math.floor(Date.now() / 1000);

  try {
    if (type === "donation.created") {
      // One-off coffee: add once to the base total. Guard against BMC retries.
      const amount = extractAmount(data);
      const eventKey = `donation:${event.event_id ?? "x"}:${data.id ?? crypto.randomUUID()}`;
      const fundingRef: admin.firestore.DocumentReference = firestore
        .collection("meta")
        .doc("funding");
      const eventRef: admin.firestore.DocumentReference = firestore
        .collection("bmcFundingEvents")
        .doc(eventKey);

      const isNewDonation = await firestore.runTransaction(async (tx: admin.firestore.Transaction) => {
        if ((await tx.get(eventRef)).exists) return false;
        const snap = await tx.get(fundingRef);
        const cur = snap.exists ? snap.data() ?? {} : {};
        tx.set(
          fundingRef,
          {
            oneOffTotal: num(cur.oneOffTotal) + amount,
            oneOffSupporters: num(cur.oneOffSupporters) + 1,
            updatedAt: TS(),
          },
          { merge: true }
        );
        tx.set(eventRef, { type, amount, at: TS() });
        return true;
      });

      if (isNewDonation) {
        await postDonationActivity(data, amount, "one_off");
        await grantSupporterBadge(data, type);
      }
    } else if (
      type === "recurring_donation.started" ||
      type === "recurring_donation.created"
    ) {
      // Record the subscription once. The lifetime read accrues
      // `amount × months elapsed` from startedAt — no per-month event needed.
      const ref: admin.firestore.DocumentReference = firestore
        .collection("bmcRecurring")
        .doc(String(data.id ?? crypto.randomUUID()));
      const isNewSubscription = !(await ref.get()).exists;
      await ref.set(
        {
          amount: extractAmount(data),
          startedAt: num(data.started_at ?? data.current_period_start ?? created),
          durationType: data.duration_type ?? "month",
          status: "active",
          endedAt: null,
          supporterId: data.supporter_id ?? null,
          supporterName: data.supporter_name ?? null,
          updatedAt: TS(),
        },
        { merge: true }
      );

      if (isNewSubscription) {
        await postDonationActivity(data, extractAmount(data), "recurring");
        await grantSupporterBadge(data, type);
      }
    } else if (
      type === "recurring_donation.updated" ||
      type === "recurring_donation.cancelled" ||
      type === "recurring_donation.canceled"
    ) {
      // Sync status. Once inactive we freeze accrual at endedAt.
      const inactive =
        type !== "recurring_donation.updated" ||
        truthy(data.canceled) ||
        truthy(data.paused) ||
        (data.status && data.status !== "active");
      const endedAt = inactive
        ? num(data.canceled_at ?? data.paused_at ?? created)
        : null;
      const ref: admin.firestore.DocumentReference = firestore
        .collection("bmcRecurring")
        .doc(String(data.id ?? crypto.randomUUID()));
      await ref.set(
        {
          amount: extractAmount(data),
          status: inactive ? "inactive" : "active",
          endedAt,
          updatedAt: TS(),
        },
        { merge: true }
      );
    }
  } catch (error) {
    logger.error(error, { context: "bmcWebhook", extra: { type } });
    // Return 200: idempotency guards double counting on BMC's retry, and we
    // don't want noisy retries for a transient Firestore hiccup.
    return res.status(200).json({ received: true, stored: false });
  }

  // BMC needs a quick 2xx or it disables the endpoint.
  return res.status(200).json({ received: true });
}
