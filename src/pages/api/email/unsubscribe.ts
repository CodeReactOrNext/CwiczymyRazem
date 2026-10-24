import { readUnsubscribeToken } from "lib/email/unsubscribe";
import type { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "utils/firebase/api/firebase.config";

// Firestore's NOT_FOUND: the account was deleted after the email went out.
const NOT_FOUND = 5;

/**
 * Target of the `List-Unsubscribe` header (see lib/email/unsubscribe). Mail
 * apps POST here when the reader presses their own "Unsubscribe" button, which
 * turns that one kind of email off. A plain GET — a browser opening the link —
 * changes nothing, since link scanners open every URL in an email; it lands on
 * the email settings instead.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    return res.redirect(303, "/settings?tab=notifications");
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).end();
  }

  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET;
  const token = typeof req.query.token === "string" ? req.query.token : "";
  const target = secret ? readUnsubscribeToken(token, secret) : null;
  if (!target) {
    return res.status(400).json({ error: "Invalid unsubscribe link" });
  }

  try {
    await firestore
      .collection("users")
      .doc(target.uid)
      .update({ [`emailNotifications.${target.category}`]: false });
  } catch (error) {
    if ((error as { code?: unknown })?.code !== NOT_FOUND) {
      console.error("[email-unsubscribe] failed for", target.uid, error);
      return res.status(500).json({ error: "Could not unsubscribe" });
    }
  }

  return res.status(200).json({ unsubscribed: target.category });
}
